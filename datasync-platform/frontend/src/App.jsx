import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import ConnectorCatalog from './pages/ConnectorCatalog'
import Connectors from './pages/Connectors'
import Destinations from './pages/Destinations'
import Connections from './pages/Connections'
import ConnectionDetail from './pages/ConnectionDetail'
import SyncHistory from './pages/SyncHistory'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/catalog" element={<ConnectorCatalog />} />
        <Route path="/connectors" element={<Connectors />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/connections/:id" element={<ConnectionDetail />} />
        <Route path="/syncs" element={<SyncHistory />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
