import { FC } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from 'react-i18next';
import { StyledSmartAssistButton } from './SmartAssistButton.styles';

interface SmartAssistButtonProps {
  onClick: () => void;
  disabled?: boolean;
  placement?: 'floating' | 'inline';
}

const SmartAssistButton: FC<SmartAssistButtonProps> = ({
  onClick,
  disabled = false,
  placement = 'floating',
}) => {
  const { t } = useTranslation();

  return (
    <StyledSmartAssistButton
      $placement={placement}
      aria-label={t('smartAdd.title', { defaultValue: 'Smart Add' })}
      onClick={onClick}
      disabled={disabled}
    >
      <AutoAwesomeIcon />
    </StyledSmartAssistButton>
  );
};

export default SmartAssistButton;
