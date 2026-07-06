import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { AuthProvider, useAuth } from './src/auth/AuthContext'
import { LoginScreen } from './src/screens/LoginScreen'
import { TalhoesScreen } from './src/screens/TalhoesScreen'

function Root() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  return isAuthenticated ? <TalhoesScreen /> : <LoginScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
      <StatusBar style="auto" />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
})
