
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getAllUsers } from '@/utils/storage';
import { getAllProgrammes } from '@/utils/storage';

interface Client {
  id: string;
  email: string;
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  userType: string;
}

interface Programme {
  id: string;
  nom: string;
  type: 'nutrition' | 'sport';
  description: string;
  createdAt: string;
}

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  useEffect(() => {
    chargerClients();
    chargerProgrammes();
  }, []);

  const chargerClients = async () => {
    try {
      const users = await getAllUsers();
      const clientsFiltered = users.filter(user => user.userType === 'client');
      setClients(clientsFiltered);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const chargerProgrammes = async () => {
    try {
      const programmesData = await getAllProgrammes();
      setProgrammes(programmesData);
    } catch (error) {
      console.error('Erreur lors du chargement des programmes:', error);
    }
  };

  const ouvrirModalProgrammes = (type: 'nutrition' | 'sport') => {
    const programmesFiltered = programmes.filter(p => p.type === type);
    
    if (programmesFiltered.length === 0) {
      Alert.alert(
        'Aucun programme',
        `Aucun programme ${type === 'nutrition' ? 'de nutrition' : 'sportif'} n'a été créé.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const titres = programmesFiltered.map(p => p.nom).join('\n• ');
    Alert.alert(
      `Programmes ${type === 'nutrition' ? 'de Nutrition' : 'Sportifs'}`,
      `Programmes disponibles :\n\n• ${titres}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { 
          text: 'Gérer les programmes', 
          onPress: () => router.push('/(coach)/programmes')
        }
      ]
    );
  };

  const ajouterClient = () => {
    Alert.alert(
      'Ajouter un client',
      'Fonctionnalité à venir - Les clients peuvent s\'inscrire via l\'application.',
      [{ text: 'OK' }]
    );
  };

  const renderClientCard = (client: Client) => (
    <View key={client.id} style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
            {client.name?.substring(0, 2).toUpperCase() || client.email.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name || 'Nom non défini'}</Text>
          <Text style={styles.clientDetail}>Email: {client.email}</Text>
          {client.age && <Text style={styles.clientDetail}>Age: {client.age} ans</Text>}
          {client.weight && <Text style={styles.clientDetail}>Poids: {client.weight} kg</Text>}
          {client.height && <Text style={styles.clientDetail}>Taille: {client.height} cm</Text>}
        </View>
      </View>
      
      <View style={styles.programButtons}>
        <TouchableOpacity 
          style={styles.programButton}
          onPress={() => ouvrirModalProgrammes('nutrition')}
        >
          <Text style={styles.programButtonIcon}>📄</Text>
          <Text style={styles.programButtonText}>Programme nutrition</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.programButton}
          onPress={() => ouvrirModalProgrammes('sport')}
        >
          <Text style={styles.programButtonIcon}>💪</Text>
          <Text style={styles.programButtonText}>Programme entrainement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Clients</Text>
          <TouchableOpacity style={styles.addClientButton} onPress={ajouterClient}>
            <Text style={styles.addClientButtonText}>+ Ajouter un client</Text>
          </TouchableOpacity>
        </View>

        {/* Mes clients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mes clients ({clients.length})
          </Text>
          
          {clients.length > 0 ? (
            clients.map(renderClientCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={styles.emptyStateTitle}>Aucun client inscrit</Text>
              <Text style={styles.emptyStateDescription}>
                Les clients peuvent s'inscrire via l'application mobile pour apparaître ici.
              </Text>
            </View>
          )}
        </View>

        {/* Statistiques */}
        {clients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Statistiques</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{clients.length}</Text>
                <Text style={styles.statLabel}>Clients total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{programmes.filter(p => p.type === 'nutrition').length}</Text>
                <Text style={styles.statLabel}>Prog. nutrition</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{programmes.filter(p => p.type === 'sport').length}</Text>
                <Text style={styles.statLabel}>Prog. sport</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addClientButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addClientButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  clientDetail: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 2,
  },
  programButtons: {
    gap: 12,
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  programButtonIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  programButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
});
