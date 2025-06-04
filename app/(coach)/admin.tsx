
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

export default function AdminScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await loadUsers();
      Alert.alert('Succès', 'Rôle utilisateur mis à jour');
    } catch (error) {
      console.error('Erreur changement rôle:', error);
      Alert.alert('Erreur', 'Impossible de changer le rôle');
    }
  };

  const deleteUser = async (userId: string) => {
    Alert.alert(
      'Confirmer suppression',
      'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId));
              await loadUsers();
              Alert.alert('Succès', 'Utilisateur supprimé');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Administration</Text>
          <Text style={styles.subtitle}>Gestion des utilisateurs</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisateurs ({users.length})</Text>
          
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.prenom} {user.nom}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={[styles.userRole, { color: user.role === 'admin' ? '#F5A623' : user.role === 'coach' ? '#4ECDC4' : '#8B949E' }]}>
                  {user.role.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
                  onPress={() => changeUserRole(user.id, user.role === 'coach' ? 'client' : 'coach')}
                >
                  <Text style={styles.actionButtonText}>
                    {user.role === 'coach' ? '→ Client' : '→ Coach'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={() => deleteUser(user.id)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  userCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
