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
  { key: 'talhoes', label: 'Talhões' },
  { key: 'reconhecimento', label: 'Reconhecimento IA' },
  { key: 'inspecoes', label: 'Inspeções' },
  { key: 'fotografias', label: 'Fotos' },
  { key: 'aplicacoes', label: 'Aplicações' },
  { key: 'solo', label: 'Solo' },
  { key: 'pragas', label: 'Pragas' },
  { key: 'doencas', label: 'Doenças' },
  { key: 'plantas_daninhas', label: 'Plantas Daninhas' },
  { key: 'atipicas', label: 'Plantas Atípicas' },
  { key: 'colheita', label: 'Colheita' },
  { key: 'ndvi', label: 'NDVI' },
  { key: 'produtividade', label: 'Produtividade' },
  { key: 'validacao_plantas_atipicas', label: 'Validação' },
] as const

type Tab = (typeof TABS)[number]['key']

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
    paddingVertical: 12,
    paddingHorizontal: 16,
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
