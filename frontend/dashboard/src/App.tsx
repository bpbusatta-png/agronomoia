import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import { EntityCrudPage } from './components/EntityCrudPage'
import {
  allConfigs,
  analisesSoloConfig,
  aplicacoesConfig,
  contratosConfig,
  cooperadosConfig,
  cultivaresConfig,
  empresasConfig,
  fazendasConfig,
  fotografiasConfig,
  historicoClimaticoConfig,
  inspecoesConfig,
  safrasConfig,
  talhoesConfig,
} from './entities/configs'
import { AppShell } from './layout/AppShell'
import { HomePage } from './pages/HomePage'

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
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
