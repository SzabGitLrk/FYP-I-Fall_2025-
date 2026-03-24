import { FC } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from 'react-i18next';
import { StyledSmartAssistButton } from './SmartAssistButton.styles';

interface SmartAssistButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const SmartAssistButton: FC<SmartAssistButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <StyledSmartAssistButton
      aria-label={t('smartAssist.title', { defaultValue: 'Smart Assist' })}
      onClick={onClick}
      disabled={disabled}
    >
      <AutoAwesomeIcon />
    </StyledSmartAssistButton>
  );
};

export default SmartAssistButton;
