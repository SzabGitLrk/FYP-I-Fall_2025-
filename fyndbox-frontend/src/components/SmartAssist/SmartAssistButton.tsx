import { FC } from 'react';
import { Tooltip } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
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
  const label = t('smartAdd.title', { defaultValue: 'Smart Add' });

  return (
    <Tooltip title={label} placement="left" arrow>
      <StyledSmartAssistButton
        $placement={placement}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        <AddRoundedIcon />
      </StyledSmartAssistButton>
    </Tooltip>
  );
};

export default SmartAssistButton;
