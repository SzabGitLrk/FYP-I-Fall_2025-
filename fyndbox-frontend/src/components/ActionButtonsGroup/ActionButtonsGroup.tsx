import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Delete } from '@mui/icons-material';
import { ButtonsGroupWrapper, CustomIcon } from '../../styles/commonStyles';
import { DeleteButton, SaveButton } from './ActionButtonsGroup.styles';
import { EntityType } from '../../types/entityTypes';
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';

interface ActionButtonsGroupProps {
  showDeleteButton?: boolean;
  entityType: EntityType;
  onSaveClick?: (data?: any) => void;
  onDeleteClick?: () => void;
}

const ActionButtonsGroup: FC<ActionButtonsGroupProps> = ({
  showDeleteButton = false,
  entityType,
  onSaveClick,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (onDeleteClick) {
      onDeleteClick();
    }
    handleCloseDeleteDialog();
  };

  return (
    <>
      <ButtonsGroupWrapper>
        <SaveButton
          variant="contained"
          startIcon={
            <CustomIcon>
              <Check />
            </CustomIcon>
          }
          onClick={() => onSaveClick && onSaveClick()}
        >
          {t('modal.save')}
        </SaveButton>

        {showDeleteButton && (
          <DeleteButton
            variant="contained"
            startIcon={
              <CustomIcon>
                <Delete />
              </CustomIcon>
            }
            onClick={handleOpenDeleteDialog}
          >
            {t('modal.delete')}
          </DeleteButton>
        )}
      </ButtonsGroupWrapper>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        titleKey="modal.deleteTitle"
        messageKey="modal.deleteConfirmation"
        confirmButtonTextKey="modal.delete"
        titleParams={{ type: t(`types.${entityType}`) }}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />
    </>
  );
};

export default ActionButtonsGroup;
