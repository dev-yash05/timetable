// app/(tabs)/profile.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    // Platform-aware confirmation dialog
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        logout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: () => logout() },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar & User Info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>
        <Text style={styles.uidText}>ID: {user?.uid.substring(0, 8)}...</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingsRow}>
          <Ionicons name="person-outline" size={24} color="#1C1C1E" />
          <Text style={styles.settingsText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow}>
          <Ionicons name="notifications-outline" size={24} color="#1C1C1E" />
          <Text style={styles.settingsText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingsRow}>
          <Ionicons name="help-circle-outline" size={24} color="#1C1C1E" />
          <Text style={styles.settingsText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  
  profileHeader: { backgroundColor: '#fff', padding: 30, alignItems: 'center', borderBottomWidth: 1, borderColor: '#E5E5EA', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF5733', justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#FF5733', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  emailText: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 5 },
  uidText: { fontSize: 14, color: '#8E8E93' },
  
  settingsSection: { marginBottom: 20, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E5EA' },
  sectionTitle: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5, fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', backgroundColor: '#F2F2F7' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  settingsText: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 15 },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 15, marginTop: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E5EA' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FF3B30', marginLeft: 10 }
});