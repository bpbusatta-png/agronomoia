import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import { EntityCrudPage } from './components/EntityCrudPage'
import {
  allConfigs,
  analisesSoloConfig,
  aplicacoesConfig,
  colheitaConfig,
  contratosConfig,
  cooperadosConfig,
  cultivaresConfig,
  doencasCatalogoConfig,
  empresasConfig,
  fazendasConfig,
  fotografiasConfig,
  historicoClimaticoConfig,
  inspecoesConfig,
  modelosVersoesConfig,
  ndviLeiturasConfig,
  ocorrenciasDoencasConfig,
  ocorrenciasPragasConfig,
  pragasCatalogoConfig,
  produtividadeEstimativasConfig,
  safrasConfig,
  talhoesConfig,
} from './entities/configs'
import { AppShell } from './layout/AppShell'
import { HomePage } from './pages/HomePage'
import { PlantasAtipicasPage } from './pages/PlantasAtipicasPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/empresas" element={<EntityCrudPage config={empresasConfig} refConfigs={allConfigs} />} />
            <Route
              path="/cooperados"
              element={<EntityCrudPage config={cooperadosConfig} refConfigs={allConfigs} />}
            />
            <Route path="/fazendas" element={<EntityCrudPage config={fazendasConfig} refConfigs={allConfigs} />} />
            <Route path="/safras" element={<EntityCrudPage config={safrasConfig} refConfigs={allConfigs} />} />
            <Route
              path="/cultivares"
              element={<EntityCrudPage config={cultivaresConfig} refConfigs={allConfigs} />}
            />
            <Route path="/talhoes" element={<EntityCrudPage config={talhoesConfig} refConfigs={allConfigs} />} />
            <Route path="/contratos" element={<EntityCrudPage config={contratosConfig} refConfigs={allConfigs} />} />
            <Route
              path="/inspecoes"
              element={<EntityCrudPage config={inspecoesConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/aplicacoes"
              element={<EntityCrudPage config={aplicacoesConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/historico-climatico"
              element={<EntityCrudPage config={historicoClimaticoConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/analises-solo"
              element={<EntityCrudPage config={analisesSoloConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/fotografias"
              element={<EntityCrudPage config={fotografiasConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/modelos-versoes"
              element={<EntityCrudPage config={modelosVersoesConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/pragas-catalogo"
              element={<EntityCrudPage config={pragasCatalogoConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/doencas-catalogo"
              element={<EntityCrudPage config={doencasCatalogoConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/ocorrencias-pragas"
              element={<EntityCrudPage config={ocorrenciasPragasConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/ocorrencias-doencas"
              element={<EntityCrudPage config={ocorrenciasDoencasConfig} refConfigs={allConfigs} />}
            />
            <Route path="/plantas-atipicas" element={<PlantasAtipicasPage />} />
            <Route
              path="/ndvi-leituras"
              element={<EntityCrudPage config={ndviLeiturasConfig} refConfigs={allConfigs} />}
            />
            <Route
              path="/produtividade-estimativas"
              element={<EntityCrudPage config={produtividadeEstimativasConfig} refConfigs={allConfigs} />}
            />
            <Route path="/colheita" element={<EntityCrudPage config={colheitaConfig} refConfigs={allConfigs} />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
