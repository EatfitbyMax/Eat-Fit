import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { OpenFoodFactsService, FoodProduct } from '@/utils/openfoodfacts';
import { ImageRecognitionService } from '@/utils/imageRecognition';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Import conditionnel du BarCodeScanner seulement sur mobile
let BarCodeScanner: any = null;
let Camera: any = null;

if (Platform.OS !== 'web') {
  try {
    const barcodeModule = require('expo-barcode-scanner');
    BarCodeScanner = barcodeModule.BarCodeScanner;
    console.log('✅ BarCodeScanner chargé');
  } catch (error) {
    console.log('⚠️ BarCodeScanner non disponible:', error);
  }
  
  try {
    const cameraModule = require('expo-camera');
    Camera = cameraModule.Camera;
    console.log('✅ Camera chargé');
  } catch (error) {
    console.log('⚠️ Camera non disponible:', error);
  }
}

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (product: FoodProduct, quantity: number) => void;
  mealType: string;
}

export default function FoodSearchModal({ visible, onClose, onAddFood, mealType }: FoodSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [favoriteFoods, setFavoriteFoods] = useState<FoodProduct[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualBarcode, setShowManualBarcode] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFavoriteFoods();
    }
  }, [visible]);

  useEffect(() => {
    (async () => {
      if (BarCodeScanner && Platform.OS !== 'web') {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.log('Erreur permissions scanner:', error);
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
    })();
  }, []);

  const loadFavoriteFoods = async () => {
    try {
      const { getCurrentUser } = require('@/utils/auth');
      const user = await getCurrentUser();
      if (user) {
        const favorites = await OpenFoodFactsService.getFavoriteFoods(user.id);
        setFavoriteFoods(favorites);
        if (favorites.length > 0) {
          setSearchResults(favorites);
        } else {
          // Si pas de favoris, afficher les aliments populaires
          const popularFoods = OpenFoodFactsService.getPopularFoods();
          setSearchResults(popularFoods);
        }
      } else {
        const popularFoods = OpenFoodFactsService.getPopularFoods();
        setSearchResults(popularFoods);
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      const popularFoods = OpenFoodFactsService.getPopularFoods();
      setSearchResults(popularFoods);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadFavoriteFoods();
      return;
    }

    setLoading(true);
    try {
      const results = await OpenFoodFactsService.searchFood(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rechercher les aliments. Vérifiez votre connexion internet.');
      // En cas d'erreur, afficher les favoris
      loadFavoriteFoods();
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setShowScanner(false);
    setLoading(true);

    try {
      const product = await OpenFoodFactsService.getProductByBarcode(data);
      if (product) {
        setSelectedProduct(product);
        setShowQuantityModal(true);
      } else {
        Alert.alert('Produit non trouvé', 'Ce code-barres n\'est pas reconnu dans la base de données.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les informations du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleScannerPress = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Saisie manuelle de code-barres', 
        'Le scanner automatique n\'est pas disponible sur web. Voulez-vous saisir manuellement un code-barres ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Saisir', onPress: () => setShowManualBarcode(true) }
        ]
      );
      return;
    }

    if (!Camera || !BarCodeScanner) {
      Alert.alert(
        'Scanner non disponible',
        'Le scanner automatique n\'est pas disponible. Voulez-vous saisir manuellement un code-barres ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Saisir', onPress: () => setShowManualBarcode(true) }
        ]
      );
      return;
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    const hasPermission = status === 'granted';

    if (hasPermission === false) {
      Alert.alert(
        'Permission requise',
        'L\'accès à la caméra est nécessaire pour scanner les codes-barres. Voulez-vous saisir manuellement un code-barres ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Saisir', onPress: () => setShowManualBarcode(true) }
        ]
      );
      return;
    }

    setShowScanner(true);
  };

  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un code-barres valide');
      return;
    }

    setShowManualBarcode(false);
    setLoading(true);

    try {
      const product = await OpenFoodFactsService.getProductByBarcode(manualBarcode.trim());
      if (product) {
        setSelectedProduct(product);
        setShowQuantityModal(true);
      } else {
        Alert.alert('Produit non trouvé', 'Ce code-barres n\'est pas reconnu dans la base de données.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les informations du produit');
    } finally {
      setLoading(false);
      setManualBarcode('');
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire pour prendre une photo');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const recognizedFoods = await ImageRecognitionService.recognizeFood(
          result.assets[0].base64 || ''
        );

        if (recognizedFoods.length > 0) {
          setSearchResults(recognizedFoods);
          setSearchQuery(''); // Clear search query to show photo results
          Alert.alert(
            'Aliments détectés !',
            `${recognizedFoods.length} aliment(s) reconnu(s) dans votre photo. Sélectionnez celui qui correspond le mieux.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Aucun aliment détecté',
            'Impossible de reconnaître des aliments dans cette image. Essayez une photo plus claire ou utilisez la recherche manuelle.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Erreur reconnaissance photo:', error);
        Alert.alert(
          'Erreur',
          'Impossible d\'analyser la photo. Réessayez avec une image plus claire.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProductSelect = (product: FoodProduct) => {
    setSelectedProduct(product);
    setShowQuantityModal(true);
  };

  const handleAddFood = async () => {
    if (!selectedProduct) {
      Alert.alert('Erreur', 'Aucun produit sélectionné');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
      return;
    }

    // Ajouter aux favoris si ce n'est pas déjà fait
    try {
      const { getCurrentUser } = require('@/utils/auth');
      const user = await getCurrentUser();
      if (user) {
        await OpenFoodFactsService.addToFavorites(user.id, selectedProduct);
      }
    } catch (error) {
      console.error('Erreur ajout favori:', error);
    }

    // Fermer la modal de quantité d'abord
    setShowQuantityModal(false);

    // Appeler la fonction parent avec le produit et la quantité
    onAddFood(selectedProduct, quantityNum);
  };

  const resetModal = () => {
    setSearchQuery('');
    setSelectedProduct(null);
    setQuantity('100');
    setShowQuantityModal(false);
    setShowScanner(false);
    setShowManualBarcode(false);
    setManualBarcode('');
    loadFavoriteFoods();
    onClose();
  };

  const renderNutritionInfo = (product: FoodProduct) => {
    try {
      const quantityNum = parseFloat(quantity) || 100;
      const nutrition = OpenFoodFactsService.calculateNutrition(product, quantityNum);

      return (
        <View style={styles.nutritionInfo}>
          <Text style={styles.nutritionTitle}>Pour {quantityNum}g :</Text>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionText}>Calories: {nutrition.calories || 0} kcal</Text>
            <Text style={styles.nutritionText}>Protéines: {nutrition.proteins || 0}g</Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionText}>Glucides: {nutrition.carbohydrates || 0}g</Text>
            <Text style={styles.nutritionText}>Lipides: {nutrition.fat || 0}g</Text>
          </View>
        </View>
      );
    } catch (error) {
      console.error('Erreur calcul nutrition:', error);
      return (
        <View style={styles.nutritionInfo}>
          <Text style={styles.nutritionTitle}>Informations nutritionnelles non disponibles</Text>
        </View>
      );
    }
  };

  if (showScanner && BarCodeScanner && Platform.OS !== 'web') {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>Scannez le code-barres du produit</Text>
            <TouchableOpacity
              style={styles.cancelScanButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.cancelScanText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={resetModal}>
            <Text style={styles.cancelButton}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ajouter un aliment</Text>
          <Text style={styles.mealType}>{mealType}</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un aliment..."
              placeholderTextColor="#8B949E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, Platform.OS === 'web' && styles.disabledButton]}
              onPress={handleScannerPress}
            >
              <Text style={[styles.actionButtonText, Platform.OS === 'web' && styles.disabledButtonText]}>
                📷 Scanner{Platform.OS === 'web' ? ' (Mobile seulement)' : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.actionButtonText}>📸 Reconnaître</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <ScrollView style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1F6FEB" />
              <Text style={styles.loadingText}>Recherche en cours...</Text>
            </View>
          ) : (
            <>
              {searchQuery === '' && (
                <Text style={styles.sectionTitle}>
                  {favoriteFoods.length > 0 ? 'Mes aliments favoris' : 'Aliments populaires'}
                </Text>
              )}
              {searchResults.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productItem}
                  onPress={() => handleProductSelect(product)}
                >
                  <View style={styles.productInfo}>
                    {product.image_url && (
                      <Image source={{ uri: product.image_url }} style={styles.productImage} />
                    )}
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{product.name}</Text>
                      {product.brand && (
                        <Text style={styles.productBrand}>{product.brand}</Text>
                      )}
                      <Text style={styles.productCalories}>
                        {product.nutriments.energy_kcal || 0} kcal/100g
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.addIcon}>+</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>

        {/* Manual Barcode Modal */}
        <Modal
          visible={showManualBarcode}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowManualBarcode(false)}
        >
          <View style={styles.quantityModalOverlay}>
            <View style={styles.quantityModalContent}>
              <Text style={styles.quantityModalTitle}>
                Saisir un code-barres
              </Text>

              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Code-barres :</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  keyboardType="numeric"
                  placeholder="Entrez le code-barres"
                  placeholderTextColor="#8B949E"
                />
              </View>

              <View style={styles.quantityButtons}>
                <TouchableOpacity
                  style={styles.quantityCancelButton}
                  onPress={() => setShowManualBarcode(false)}
                >
                  <Text style={styles.quantityCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quantityAddButton}
                  onPress={handleManualBarcodeSubmit}
                >
                  <Text style={styles.quantityAddText}>Rechercher</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Quantity Modal */}
        <Modal
          visible={showQuantityModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowQuantityModal(false)}
        >
          <View style={styles.quantityModalOverlay}>
            <View style={styles.quantityModalContent}>
              <Text style={styles.quantityModalTitle}>
                {selectedProduct?.name}
              </Text>

              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Quantité (grammes) :</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#8B949E"
                />
              </View>

              {selectedProduct && renderNutritionInfo(selectedProduct)}

              <View style={styles.quantityButtons}>
                <TouchableOpacity
                  style={styles.quantityCancelButton}
                  onPress={() => setShowQuantityModal(false)}
                >
                  <Text style={styles.quantityCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quantityAddButton}
                  onPress={handleAddFood}
                >
                  <Text style={styles.quantityAddText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  cancelButton: {
    color: '#8B949E',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mealType: {
    color: '#1F6FEB',
    fontSize: 14,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  searchButton: {
    backgroundColor: '#1F6FEB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchButtonText: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#161B22',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#8B949E',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#8B949E',
    marginTop: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  productBrand: {
    color: '#8B949E',
    fontSize: 14,
    marginBottom: 2,
  },
  productCalories: {
    color: '#F5A623',
    fontSize: 12,
  },
  addIcon: {
    color: '#1F6FEB',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelScanButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelScanText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  quantityModalContent: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  quantityModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  nutritionInfo: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  nutritionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutritionText: {
    color: '#8B949E',
    fontSize: 12,
    flex: 1,
  },
  quantityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityCancelButton: {
    flex: 1,
    backgroundColor: '#21262D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quantityCancelText: {
    color: '#8B949E',
    fontSize: 16,
  },
  quantityAddButton: {
    flex: 1,
    backgroundColor: '#1F6FEB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quantityAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});