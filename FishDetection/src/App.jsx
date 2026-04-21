import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import GalleryPage from './pages/GalleryPage';
import HistoryPage from './pages/HistoryPage';
import SpeciesDetailPage from './pages/SpeciesDetailPage';
import { DetectionProvider } from './context/DetectionContext';

function App() {
  return (
    <BrowserRouter>
      <DetectionProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/species/:id" element={<SpeciesDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </DetectionProvider>
    </BrowserRouter>
  );
}

export default App;
