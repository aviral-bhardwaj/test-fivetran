import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ConnectorCatalog from './pages/ConnectorCatalog';
import Destinations from './pages/Destinations';
import ConnectionDetail from './pages/ConnectionDetail';
import SyncHistory from './pages/SyncHistory';
import Settings from './pages/Settings';
import MARUsage from './pages/MARUsage';
import Transformations from './pages/Transformations';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/connectors" element={<Dashboard />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/transformations" element={<Transformations />} />
        <Route path="/usage" element={<MARUsage />} />
        <Route path="/syncs" element={<SyncHistory />} />
        <Route path="/catalog" element={<ConnectorCatalog />} />
        <Route path="/connections" element={<Dashboard />} />
        <Route path="/connections/:id" element={<ConnectionDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
