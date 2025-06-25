
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Modal,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from '@/utils/storage';

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'suivi' | 'urgence';
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  coachId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export default function RdvScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'today'>('pending');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadAppointments(), loadClients()]);
  };

  const loadAppointments = async () => {
    try {
      // Charger tous les rendez-vous de tous les clients
      const users = await PersistentStorage.getUsers();
      const clientUsers = users.filter(user => user.userType === 'client');
      
      let allAppointments: Appointment[] = [];
      
      for (const client of clientUsers) {
        try {
          const clientAppointments = await AsyncStorage.getItem(`appointments-${client.id}`);
          if (clientAppointments) {
            const parsed = JSON.parse(clientAppointments);
            const appointmentsWithClientInfo = parsed.map((apt: Appointment) => ({
              ...apt,
              clientName: client.name,
              clientEmail: client.email
            }));
            allAppointments = [...allAppointments, ...appointmentsWithClientInfo];
          }
        } catch (error) {
          console.error(`Erreur chargement RDV client ${client.id}:`, error);
        }
      }

      // Trier par date et heure
      allAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(allAppointments);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    }
  };

  const loadClients = async () => {
    try {
      const users = await PersistentStorage.getUsers();
      const clientUsers = users.filter(user => user.userType === 'client');
      setClients(clientUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      })));
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'confirmed' | 'cancelled' | 'completed', newNotes?: string) => {
    try {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) return;

      // Mettre à jour dans AsyncStorage du client
      const clientAppointments = await AsyncStorage.getItem(`appointments-${appointment.clientId}`);
      if (clientAppointments) {
        const parsed = JSON.parse(clientAppointments);
        const updatedAppointments = parsed.map((apt: Appointment) => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus, notes: newNotes || apt.notes }
            : apt
        );
        await AsyncStorage.setItem(`appointments-${appointment.clientId}`, JSON.stringify(updatedAppointments));
      }

      // Mettre à jour l'état local
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: newStatus, notes: newNotes || apt.notes }
          : apt
      ));

      Alert.alert('Succès', `Rendez-vous ${newStatus === 'confirmed' ? 'confirmé' : newStatus === 'cancelled' ? 'annulé' : 'marqué comme terminé'}`);
    } catch (error) {
      console.error('Erreur mise à jour RDV:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le rendez-vous');
    }
  };

  const getFilteredAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (selectedFilter) {
      case 'pending':
        return appointments.filter(apt => apt.status === 'pending');
      case 'confirmed':
        return appointments.filter(apt => apt.status === 'confirmed');
      case 'today':
        return appointments.filter(apt => apt.date === today);
      default:
        return appointments;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F5A623';
      case 'confirmed': return '#00D26A';
      case 'cancelled': return '#DA3633';
      case 'completed': return '#8B949E';
      default: return '#8B949E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'suivi': return 'Suivi';
      case 'urgence': return 'Urgence';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotes(appointment.notes || '');
    setModalVisible(true);
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Rendez-vous</Text>
          <Text style={styles.subtitle}>
            Confirmez et gérez les demandes de rendez-vous de vos clients
          </Text>
        </View>

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('pending')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
                ⏳ En attente ({appointments.filter(apt => apt.status === 'pending').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'confirmed' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('confirmed')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'confirmed' && styles.filterButtonTextActive]}>
                ✅ Confirmés ({appointments.filter(apt => apt.status === 'confirmed').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'today' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('today')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'today' && styles.filterButtonTextActive]}>
                📅 Aujourd'hui ({appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]).length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
                📋 Tous ({appointments.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Liste des rendez-vous */}
        <View style={styles.appointmentsContainer}>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentCard}
                onPress={() => handleAppointmentPress(appointment)}
              >
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentClient}>{appointment.clientName}</Text>
                    <Text style={styles.appointmentDate}>
                      {formatDate(appointment.date)} à {appointment.time}
                    </Text>
                    <Text style={styles.appointmentType}>
                      {getTypeText(appointment.type)} • {appointment.duration}min
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
                  </View>
                </View>

                {appointment.notes && (
                  <Text style={styles.appointmentNotes} numberOfLines={2}>
                    💬 {appointment.notes}
                  </Text>
                )}

                {appointment.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        updateAppointmentStatus(appointment.id, 'confirmed');
                      }}
                    >
                      <Text style={styles.confirmButtonText}>✅ Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          'Annuler le rendez-vous',
                          'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
                          [
                            { text: 'Non', style: 'cancel' },
                            { text: 'Oui', onPress: () => updateAppointmentStatus(appointment.id, 'cancelled') }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.cancelButtonText}>❌ Annuler</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateTitle}>
                {selectedFilter === 'pending' && 'Aucun rendez-vous en attente'}
                {selectedFilter === 'confirmed' && 'Aucun rendez-vous confirmé'}
                {selectedFilter === 'today' && 'Aucun rendez-vous aujourd\'hui'}
                {selectedFilter === 'all' && 'Aucun rendez-vous'}
              </Text>
              <Text style={styles.emptyStateDescription}>
                Les demandes de rendez-vous de vos clients apparaîtront ici.
              </Text>
            </View>
          )}
        </View>

        {/* Statistiques */}
        {appointments.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 Statistiques</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{appointments.filter(apt => apt.status === 'pending').length}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{appointments.filter(apt => apt.status === 'confirmed').length}</Text>
                <Text style={styles.statLabel}>Confirmés</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{appointments.filter(apt => apt.status === 'completed').length}</Text>
                <Text style={styles.statLabel}>Terminés</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de détails */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAppointment && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Détails du rendez-vous</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.modalClientName}>{selectedAppointment.clientName}</Text>
                  <Text style={styles.modalClientEmail}>{selectedAppointment.clientEmail}</Text>
                  
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoText}>
                      📅 {formatDate(selectedAppointment.date)} à {selectedAppointment.time}
                    </Text>
                    <Text style={styles.modalInfoText}>
                      ⏱️ {getTypeText(selectedAppointment.type)} • {selectedAppointment.duration}min
                    </Text>
                    <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedAppointment.status) }]}>
                      <Text style={styles.modalStatusText}>{getStatusText(selectedAppointment.status)}</Text>
                    </View>
                  </View>

                  <Text style={styles.notesLabel}>Notes du coach :</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Ajouter des notes..."
                    placeholderTextColor="#8B949E"
                    multiline
                    numberOfLines={4}
                  />

                  <View style={styles.modalActions}>
                    {selectedAppointment.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={styles.modalConfirmButton}
                          onPress={() => {
                            updateAppointmentStatus(selectedAppointment.id, 'confirmed', notes);
                            setModalVisible(false);
                          }}
                        >
                          <Text style={styles.modalConfirmButtonText}>✅ Confirmer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.modalCancelButton}
                          onPress={() => {
                            updateAppointmentStatus(selectedAppointment.id, 'cancelled', notes);
                            setModalVisible(false);
                          }}
                        >
                          <Text style={styles.modalCancelButtonText}>❌ Annuler</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {selectedAppointment.status === 'confirmed' && (
                      <TouchableOpacity
                        style={styles.modalCompleteButton}
                        onPress={() => {
                          updateAppointmentStatus(selectedAppointment.id, 'completed', notes);
                          setModalVisible(false);
                        }}
                      >
                        <Text style={styles.modalCompleteButtonText}>✓ Marquer comme terminé</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.modalSaveNotesButton}
                      onPress={() => {
                        updateAppointmentStatus(selectedAppointment.id, selectedAppointment.status, notes);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalSaveNotesButtonText}>💾 Sauvegarder les notes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#21262D',
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#F5A623',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#8B949E',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  appointmentsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentClient: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: '#F5A623',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '600',
  },
  appointmentNotes: {
    fontSize: 12,
    color: '#8B949E',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#00D26A',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#DA3633',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
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
  // Styles pour la modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 18,
    color: '#8B949E',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalClientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalClientEmail: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  modalInfo: {
    marginBottom: 20,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  modalStatusText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  modalActions: {
    gap: 8,
  },
  modalConfirmButton: {
    backgroundColor: '#00D26A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: '#DA3633',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCompleteButton: {
    backgroundColor: '#8B949E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCompleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveNotesButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveNotesButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
});
