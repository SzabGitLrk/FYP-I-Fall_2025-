import { FC, useEffect, useState } from 'react';
import { Modal, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Close } from '@mui/icons-material';
import CustomTextField from '../CustomTextField/CustomTextField';
import { EntityType } from '../../types/entityTypes';
import { TextFieldsContainer } from '../../styles/commonStyles';
import ActionButtonsGroup from '../ActionButtonsGroup/ActionButtonsGroup';
import ModalHeading from './ModalHeading';
import {
  ModalContainer,
  ModalBox,
  CancelButton,
  QuantityContainer,
  QuantityLabel,
  ButtonContainer,
  StepperButton,
  QuantityCounter,
  ActionButtonsContainer,
} from './EntityActionModal.styles';
import ImageUploader from './ImageUploader';

interface EntityActionModalProps {
  open: boolean;
  entityType: EntityType;
  mode: 'add' | 'edit';
  initialData?: {
    name: string;
    description: string;
    image?: string;
    quantity?: number;
  };
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    image?: string;
    quantity?: number;
  }) => void;
  onDelete?: () => void;
}

const EntityActionModal: FC<EntityActionModalProps> = ({
  open,
  mode,
  entityType,
  initialData,
  onClose,
  onSave,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? '',
  );
  const [image, setImage] = useState(initialData?.image ?? '');
  const [quantity, setQuantity] = useState(initialData?.quantity ?? 1);
  const [nameError, setNameError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && mode === 'add') {
      resetFormData();
    } else if (open && mode === 'edit' && initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? '');
      setImage(initialData.image ?? '');
      setQuantity(initialData.quantity ?? 1);
    }
  }, [open, mode, initialData]);

  const resetFormData = () => {
    setName('');
    setNameError(false);
    setDescription('');
    setImage('');
    setQuantity(1);
  };

  const handleSave = () => {
    if (!name) {
      setNameError(true);
    } else {
      onSave({ name, description, image, quantity });
    }
  };

  const handleIncrease = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const handleDecrease = () => {
    setQuantity((prevQuantity) => (prevQuantity > 1 ? prevQuantity - 1 : 1)); // Minimum quantity is 1
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContainer>
        <ModalBox>
          <CancelButton onClick={onClose}>
            <Close />
          </CancelButton>

          <ModalHeading mode={mode} type={entityType} />

          <TextFieldsContainer>
            <CustomTextField
              label={t('modal.name.label')}
              placeholder={t('modal.name.placeholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(false);
                if (error) setError(null);
              }}
              error={nameError}
              helperText={
                nameError
                  ? t('modal.name.errorMessage', {
                      type: t(`types.${entityType}`),
                    })
                      .split('\n')
                      .map((line, index) => (
                        <span key={index}>
                          {line}
                          <br />
                        </span>
                      ))
                  : ''
              }
            />
            <CustomTextField
              label={t('modal.description.label')}
              placeholder={t('modal.description.placeholder')}
              value={description}
              multiline
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            />
          </TextFieldsContainer>

          {/* Quantity Counter */}
          {entityType === 'item' && (
            <QuantityContainer>
              <QuantityLabel variant="body1">
                {t('modal.quantity.label')}
              </QuantityLabel>
              <ButtonContainer>
                <StepperButton onClick={handleDecrease}>-</StepperButton>
                <QuantityCounter variant="body1">{quantity}</QuantityCounter>
                <StepperButton onClick={handleIncrease}>+</StepperButton>
              </ButtonContainer>
            </QuantityContainer>
          )}

          <ImageUploader
            label={t('modal.image.label')}
            initialImage={image}
            onImageUpload={(uploadedImage) => {
              setImage(uploadedImage ?? '');
            }}
          />
          <ActionButtonsContainer>
            <ActionButtonsGroup
              showDeleteButton={mode === 'edit'}
              entityType={entityType}
              onSaveClick={handleSave}
              onDeleteClick={onDelete}
            />
          </ActionButtonsContainer>
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </ModalBox>
      </ModalContainer>
    </Modal>
  );
};

export default EntityActionModal;
