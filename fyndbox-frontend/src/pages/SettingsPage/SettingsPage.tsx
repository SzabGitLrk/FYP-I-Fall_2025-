import { FC } from 'react';
import { useLocation } from 'react-router-dom';
import SettingsMainPage from './SettingsMainPage';
import SettingsSubPage from './SettingsSubPage';

const SettingsPage: FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const section = queryParams.get('section');

  // If no section specified, show main settings page
  if (!section) {
    return <SettingsMainPage />;
  }

  // Otherwise, show the subpage
  return <SettingsSubPage section={section} />;
};

export default SettingsPage;

