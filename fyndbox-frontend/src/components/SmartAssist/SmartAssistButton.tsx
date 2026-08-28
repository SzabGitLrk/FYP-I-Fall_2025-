import { FC } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useTranslation } from 'react-i18next';
import { StyledSmartAssistButton, FABWrapper } from './SmartAssistButton.styles';

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
  const label = t('smartAdd.title', { defaultValue: 'Smart Add' });

  return (
    <FABWrapper>
      <StyledSmartAssistButton
        $placement={placement}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        <AutoAwesomeRoundedIcon />
      </StyledSmartAssistButton>
    </FABWrapper>
  );
};

export default SmartAssistButton;
