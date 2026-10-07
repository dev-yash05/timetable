// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF5733" />
      </View>
    );
  }

  // If not logged in, send to the authentication screen
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // If logged in, send to the main application tabs
  return <Redirect href="/(tabs)/timetable" />;
}