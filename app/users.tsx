import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function UsersScreen() {
  // Sample users data
  const users = [
    {
      id: '1',
      name: 'Mehmet Yılmaz',
      userNumber: '10001',
      email: 'mehmet.yilmaz@example.com',
    },
    {
      id: '2',
      name: 'Ayşe Demir',
      userNumber: '10002',
      email: 'ayse.demir@example.com',
    },
    {
      id: '3',
      name: 'Mustafa Kaya',
      userNumber: '10003',
      email: 'mustafa.kaya@example.com',
    },
    {
      id: '4',
      name: 'Zeynep Şahin',
      userNumber: '10004',
      email: 'zeynep.sahin@example.com',
    },
  ];

  // Handler functions
  const handleEditUser = (userId) => {
    // Navigate to edit user screen with the user ID
    router.push({
      pathname: '/edit-user',
      params: { userId }
    });
  };

  const handleDeleteUser = (userId, userName) => {
    // Show confirmation alert before deleting
    Alert.alert(
      "Kullanıcıyı Sil",
      `${userName} isimli kullanıcıyı silmek istediğinizden emin misiniz?`,
      [
        {
          text: "İptal",
          style: "cancel"
        },
        { 
          text: "Sil", 
          onPress: () => console.log("Delete user with ID:", userId),
          style: "destructive"
        }
      ]
    );
  };

  const handleAddUser = () => {
    // Navigate to add user screen
    router.push('/add-user');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#222222" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>TRACKIT</Text>
            <Text style={styles.headerSubTitle}>Kullanıcılar</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Feather name="users" size={24} color="#666666" />
          </View>
        </View>

        {/* User List */}
        <ScrollView 
          style={styles.userListContainer}
          contentContainerStyle={styles.userListContent}
          showsVerticalScrollIndicator={false}
        >
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userIconContainer}>
                <Feather name="user" size={28} color="#444444" />
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userNumber}>Kullanıcı No: {user.userNumber}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity 
                  style={styles.actionIcon}
                  onPress={() => handleEditUser(user.id)}
                >
                  <Feather name="edit" size={20} color="#666666" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionIcon}
                  onPress={() => handleDeleteUser(user.id, user.name)}
                >
                  <Feather name="trash-2" size={20} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Add User Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddUser}
          >
            <Text style={styles.addButtonText}>Yeni Kullanıcı Ekle</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  safeArea: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
  },
  headerSubTitle: {
    fontSize: 16,
    color: '#222222',
    marginTop: 2,
  },
  headerRight: {
    padding: 5,
  },
  userListContainer: {
    flex: 1,
    marginTop: 16,
  },
  userListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userNumber: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#777777',
  },
  userActions: {
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionIcon: {
    padding: 8,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  addButton: {
    backgroundColor: '#E6A05F',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});