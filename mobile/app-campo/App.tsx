import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AuthProvider, useAuth } from './src/auth/AuthContext'
import { AnalisesSoloScreen } from './src/screens/AnalisesSoloScreen'
import { AplicacoesScreen } from './src/screens/AplicacoesScreen'
import { ColheitaScreen } from './src/screens/ColheitaScreen'
import { FotografiasScreen } from './src/screens/FotografiasScreen'
import { InspecoesScreen } from './src/screens/InspecoesScreen'
import { LoginScreen } from './src/screens/LoginScreen'
import { NdviScreen } from './src/screens/NdviScreen'
import { OcorrenciasDoencasScreen } from './src/screens/OcorrenciasDoencasScreen'
import { OcorrenciasPlantasDaninhasScreen } from './src/screens/OcorrenciasPlantasDaninhasScreen'
import { OcorrenciasPragasScreen } from './src/screens/OcorrenciasPragasScreen'
import { PlantasAtipicasScreen } from './src/screens/PlantasAtipicasScreen'
import { PlantasAtipicasValidacaoScreen } from './src/screens/PlantasAtipicasValidacaoScreen'
import { ProdutividadeScreen } from './src/screens/ProdutividadeScreen'
import { ReconhecimentoScreen } from './src/screens/ReconhecimentoScreen'
import { TalhoesScreen } from './src/screens/TalhoesScreen'

const TABS = [
  { key: 'talhoes', label: 'Talhões', icon: 'map-marker-radius' },
  { key: 'reconhecimento', label: 'Reconhecimento IA', icon: 'auto-fix' },
  { key: 'inspecoes', label: 'Inspeções', icon: 'clipboard-check-outline' },
  { key: 'fotografias', label: 'Fotos', icon: 'camera' },
  { key: 'aplicacoes', label: 'Aplicações', icon: 'spray' },
  { key: 'solo', label: 'Solo', icon: 'flask-outline' },
  { key: 'pragas', label: 'Pragas', icon: 'bug-outline' },
  { key: 'doencas', label: 'Doenças', icon: 'virus-outline' },
  { key: 'plantas_daninhas', label: 'Plantas Daninhas', icon: 'grass' },
  { key: 'atipicas', label: 'Plantas Atípicas', icon: 'dna' },
  { key: 'colheita', label: 'Colheita', icon: 'barley' },
  { key: 'ndvi', label: 'NDVI', icon: 'satellite-variant' },
  { key: 'produtividade', label: 'Produtividade', icon: 'trending-up' },
  { key: 'validacao_plantas_atipicas', label: 'Validação', icon: 'shield-check-outline' },
] as const

type Tab = (typeof TABS)[number]['key']

function initials(email: string | null): string {
  if (!email) return '?'
  return email.slice(0, 2).toUpperCase()
}

function Header({ userEmail, onLogout }: { userEmail: string | null; onLogout: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="sprout" size={22} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Agrônomo IA</Text>
          <Text style={styles.headerSubtitle}>Inteligência agrícola em campo</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(userEmail)}</Text>
        </View>
        <Pressable onPress={onLogout} testID="logout-button" style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

function Root() {
  const { isAuthenticated, loading, userEmail, logout } = useAuth()
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
      <Header userEmail={userEmail} onLogout={logout} />
      <View style={styles.flex}>
        {tab === 'talhoes' && <TalhoesScreen />}
        {tab === 'reconhecimento' && <ReconhecimentoScreen onIrParaTab={(t) => setTab(t as Tab)} />}
        {tab === 'inspecoes' && <InspecoesScreen />}
        {tab === 'fotografias' && <FotografiasScreen />}
        {tab === 'aplicacoes' && <AplicacoesScreen />}
        {tab === 'solo' && <AnalisesSoloScreen />}
        {tab === 'pragas' && <OcorrenciasPragasScreen />}
        {tab === 'doencas' && <OcorrenciasDoencasScreen />}
        {tab === 'plantas_daninhas' && <OcorrenciasPlantasDaninhasScreen />}
        {tab === 'atipicas' && <PlantasAtipicasScreen />}
        {tab === 'colheita' && <ColheitaScreen />}
        {tab === 'ndvi' && <NdviScreen />}
        {tab === 'produtividade' && <ProdutividadeScreen />}
        {tab === 'validacao_plantas_atipicas' && <PlantasAtipicasValidacaoScreen />}
      </View>
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={styles.tabItem}
              onPress={() => setTab(t.key)}
              testID={`tab-${t.key}`}
            >
              <MaterialCommunityIcons
                name={t.icon}
                size={22}
                color={tab === t.key ? '#15803d' : '#9ca3af'}
              />
              <Text style={tab === t.key ? styles.tabTextActive : styles.tabText}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
      <StatusBar style="light" />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 2,
  },
  tabText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  tabTextActive: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
  },
})
