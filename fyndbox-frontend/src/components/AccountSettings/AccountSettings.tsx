import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CircularProgress, IconButton, Typography } from '@mui/material';
import { AccountCircle, Check, Email, PhotoCamera } from '@mui/icons-material';
import { useUpdateUser, useUser } from '../../hooks/useUser';
import { useUploadImage } from '../../hooks/useImage';
import {
  ButtonsGroupWrapper,
  CustomIcon,
  TextFieldsContainer,
} from '../../styles/commonStyles';
import CustomTextField from '../CustomTextField/CustomTextField';
import { SaveButton } from '../ActionButtonsGroup/ActionButtonsGroup.styles';
import {
  AccountSettingsContainer,
  ProfileAvatar,
  ProfileContainer,
} from './AccountSettings.styles';
import { useNavigate } from 'react-router-dom';

const AccountSettings: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user, error, isLoading } = useUser();
  const { mutate: updateUser } = useUpdateUser();
  const { mutateAsync: uploadImage, isPending } = useUploadImage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [initialName, setInitialName] = useState('');
  const [initialProfileImage, setInitialProfileImage] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfileImage(user.image || null);
      setUploadedImageUrl(user.image || null);
      setInitialName(user.name || '');
      setInitialProfileImage(user.image || null);
    }
  }, [user]);

  useEffect(() => {
    setIsChanged(name !== initialName || uploadedImageUrl !== initialProfileImage);
  }, [name, uploadedImageUrl, initialName, initialProfileImage]);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setSaveError('Image size must be less than 5MB');
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setProfileImage(preview);
      };
      reader.readAsDataURL(file);

      // Upload to server
      try {
        console.log('Uploading image to server...', file.name, file.type);
        const data = await uploadImage(file);
        console.log('Image uploaded successfully:', data.imageUrl);
        setUploadedImageUrl(data.imageUrl);
        setSaveError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to upload image. Please check your connection and try again.';
        setSaveError(errorMessage);
        console.error('Error uploading image:', {
          error: err,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
        // Keep preview visible even if upload fails
      }
    }
  };

  const handleCameraClick = () => {
    document.getElementById('avatarUpload')?.click();
  };

  const handleSave = async () => {
    if (!name) {
      setNameError(true);
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      // Use the uploaded image URL, not the preview
      const imageToSave = uploadedImageUrl || profileImage || undefined;

      updateUser(
        { user: { name, image: imageToSave } },
        {
          onSuccess: () => {
            setInitialName(name);
            setInitialProfileImage(uploadedImageUrl);
            setIsChanged(false);
            setProfileImage(uploadedImageUrl);
            setIsSaving(false);
            navigate('/dashboard');
          },
          onError: (error) => {
            setSaveError(
              error instanceof Error
                ? error.message
                : 'Failed to save profile. Please try again.',
            );
            setIsSaving(false);
            console.error('Failed to update user:', error);
          },
        },
      );
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'An error occurred during save.',
      );
      setIsSaving(false);
    }
  };

  return (
    <AccountSettingsContainer>
      {isLoading && <Typography variant="body1">Loading...</Typography>}
      <ProfileContainer>
        <ProfileAvatar src={profileImage || ''} alt={name}>
          {!profileImage && (name.charAt(0).toUpperCase() || 'F')}
        </ProfileAvatar>
        <IconButton
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleCameraClick();
          }}
          disabled={isPending}
          sx={{
            position: 'absolute',
            bottom: -10,
            right: -10,
          }}
        >
          <input
            id="avatarUpload"
            hidden
            accept="image/jpeg, image/png, image/webp"
            type="file"
            onChange={handleImageChange}
          />
          {isPending ? <CircularProgress size={24} /> : <PhotoCamera />}
        </IconButton>
      </ProfileContainer>

      <TextFieldsContainer>
        <CustomTextField
          label={t('common.name.label')}
          placeholder={t('common.name.placeholder')}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false);
          }}
          error={nameError}
          helperText={
            nameError
              ? t('common.name.errorMessage')
                  .split('\n')
                  .map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))
              : ''
          }
          startIcon={<AccountCircle />}
        />
        <CustomTextField
          label={t('common.email.label')}
          placeholder={t('common.email.placeholder')}
          type="email"
          value={email}
          startIcon={<Email />}
          readOnly
          disabled
        />
      </TextFieldsContainer>

      <ButtonsGroupWrapper>
        <SaveButton
          variant="contained"
          startIcon={
            <CustomIcon>
              <Check />
            </CustomIcon>
          }
          onClick={handleSave}
          disabled={!isChanged || isSaving}
        >
          {isSaving ? 'Saving...' : t('modal.save')}
        </SaveButton>
      </ButtonsGroupWrapper>
      {(error || saveError) && (
        <Typography variant="caption" color="error">
          {error?.message || saveError}
        </Typography>
      )}
    </AccountSettingsContainer>
  );
};

export default AccountSettings;
