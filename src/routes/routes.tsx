import { Route, Routes } from 'react-router-dom';
import Layout from '../Components/Layout/Layout';
import NotFound from '../Components/Shared/NotFound';
import ProfilePage from '../Components/Profile/ProfilePage';
import ClusterPage from '../Components/Cluster/ClusterPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProfilePage />} />
        <Route path="cluster" element={<ClusterPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
