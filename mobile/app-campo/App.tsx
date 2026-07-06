import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { AuthProvider, useAuth } from './src/auth/AuthContext'
import { FotografiasScreen } from './src/screens/FotografiasScreen'
import { InspecoesScreen } from './src/screens/InspecoesScreen'
import { LoginScreen } from './src/screens/LoginScreen'
import { TalhoesScreen } from './src/screens/TalhoesScreen'

type Tab = 'talhoes' | 'inspecoes' | 'fotografias'

function Root() {
  const { isAuthenticated, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('talhoes')

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    )
  }

  if (!isAuthenticated) return <LoginScreen />

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {tab === 'talhoes' && <TalhoesScreen />}
        {tab === 'inspecoes' && <InspecoesScreen />}
        {tab === 'fotografias' && <FotografiasScreen />}
      </View>
      <View style={styles.tabBar}>
        <Pressable style={styles.tabItem} onPress={() => setTab('talhoes')} testID="tab-talhoes">
          <Text style={tab === 'talhoes' ? styles.tabTextActive : styles.tabText}>Talhões</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab('inspecoes')} testID="tab-inspecoes">
          <Text style={tab === 'inspecoes' ? styles.tabTextActive : styles.tabText}>Inspeções</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab('fotografias')} testID="tab-fotografias">
          <Text style={tab === 'fotografias' ? styles.tabTextActive : styles.tabText}>Fotos</Text>
        </Pressable>
      </View>
    </View>
  )
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
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  tabTextActive: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
})
