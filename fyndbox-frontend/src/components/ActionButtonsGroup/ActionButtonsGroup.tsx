import { FC } from 'react';
import { Add } from '@mui/icons-material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from 'react-i18next';
import {
  ActionsContainer,
  AddStorageButton,
  SmartAddButton,
} from './ActionButtonsGroup.styles';

interface ActionButtonsGroupProps {
  onAddStorage: () => void;
  onSmartAdd: () => void;
}

const ActionButtonsGroup: FC<ActionButtonsGroupProps> = ({
  onAddStorage,
  onSmartAdd,
}) => {
  const { t } = useTranslation();

  return (
    <ActionsContainer>
      <AddStorageButton variant="contained" onClick={onAddStorage} startIcon={<Add />}>
        {t('dashboard.entity.addStorage')}
      </AddStorageButton>
      <SmartAddButton variant="outlined" onClick={onSmartAdd} startIcon={<AutoAwesomeIcon />}>
        {t('smartAdd.title', { defaultValue: 'Smart Add' })}
      </SmartAddButton>
    </ActionsContainer>
  );
};

export default ActionButtonsGroup;
