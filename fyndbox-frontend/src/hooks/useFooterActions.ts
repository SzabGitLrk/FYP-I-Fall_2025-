import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useFooterActions = () => {
  const navigate = useNavigate();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const handleFavoriteClick = () => {
    setShowFavorites((prev) => !prev);
  };

  const handleScanClick = () => {
    setShowQRScanner(true);
  };

  const handleScanSuccess = (data: string) => {
    setTimeout(() => {
      setShowQRScanner(false);
      const url = new URL(data);
      const path = url.pathname;
      navigate(path, { replace: true });
    }, 500);
  };

  const handleCancelScan = () => {
    setShowQRScanner(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleCloseSidebar = () => {
    // No longer used - settings is now a full page
  };

  const handleCloseFavbar = () => {
    setShowFavorites(false);
  };

  return {
    handleFavoriteClick,
    handleScanClick,
    handleScanSuccess,
    handleCancelScan,
    handleSettingsClick,
    handleCloseSidebar,
    handleCloseFavbar,
    showQRScanner,
    showFavorites,
    isSidebarOpen: false,
  };
};
