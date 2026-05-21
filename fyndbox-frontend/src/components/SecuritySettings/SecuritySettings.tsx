import { IconButton, Typography } from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isPasswordValid, isPasswordNonEmpty } from '../../utils/validation';
import CustomTextField from '../../components/CustomTextField/CustomTextField';
import { TextFieldsContainer } from '../../styles/commonStyles';
import { ButtonsGroupWrapper } from '../../styles/commonStyles';
import { SaveButton } from '../ActionButtonsGroup/ActionButtonsGroup.styles';
import { SecuritySettingsContainer } from './SecuritySettings.styles';

export const SecuritySettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword, error, setError } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [confirmPasswordMatchError, setConfirmPasswordMatchError] =
    useState(false);

  const handlePasswordUpdate = async () => {
    const isCurrentPasswordValid = isPasswordNonEmpty(currentPassword);
    const isNewPasswordValid = isPasswordValid(newPassword);
    const isConfirmPasswordValid = isPasswordNonEmpty(confirmPassword);
    const isDifferentPasswords = currentPassword !== newPassword;
    const doPasswordsMatch = newPassword === confirmPassword;

    setCurrentPasswordError(!isCurrentPasswordValid);
    setNewPasswordError(!isNewPasswordValid);
    setConfirmPasswordError(!isConfirmPasswordValid);
    setPasswordMatchError(!isDifferentPasswords);
    setConfirmPasswordMatchError(!doPasswordsMatch);

    if (
      isCurrentPasswordValid &&
      isNewPasswordValid &&
      isConfirmPasswordValid &&
      isDifferentPasswords &&
      doPasswordsMatch
    ) {
      const success = await updatePassword(currentPassword, newPassword);
      if (success) {
        navigate('/dashboard');
      }
    }
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <SecuritySettingsContainer>
      <TextFieldsContainer>
        <CustomTextField
          label={t('settings.security.currentPassword')}
          type={showCurrentPassword ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setCurrentPasswordError(false);
            setPasswordMatchError(false);
            if (error) setError(null);
          }}
          error={currentPasswordError}
          helperText={
            currentPasswordError
              ? t('common.password.passwordRequiredError')
              : ''
          }
          startIcon={<Lock />}
          endIcon={
            <IconButton onClick={toggleCurrentPasswordVisibility} edge="end">
              {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          }
        />
        <CustomTextField
          label={t('settings.security.newPassword')}
          type={showNewPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setNewPasswordError(false);
            setPasswordMatchError(false);
            setConfirmPasswordMatchError(false);
            if (error) setError(null);
          }}
          error={newPasswordError}
          helperText={
            newPasswordError
              ? t('common.password.invalidPasswordError')
                  .split('\n')
                  .map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))
              : ''
          }
          startIcon={<Lock />}
          endIcon={
            <IconButton onClick={toggleNewPasswordVisibility} edge="end">
              {showNewPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          }
        />
        <CustomTextField
          label={t('settings.security.confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setConfirmPasswordError(false);
            setConfirmPasswordMatchError(false);
            if (error) setError(null);
          }}
          error={confirmPasswordError || confirmPasswordMatchError}
          helperText={
            confirmPasswordError
              ? t('common.password.passwordRequiredError')
              : confirmPasswordMatchError
                ? t('settings.security.confirmPasswordMatchError')
                : ''
          }
          startIcon={<Lock />}
          endIcon={
            <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          }
        />
      </TextFieldsContainer>
      <ButtonsGroupWrapper>
        <SaveButton variant="contained" onClick={handlePasswordUpdate}>
          {t('settings.security.savePassword')}
        </SaveButton>
      </ButtonsGroupWrapper>
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
      {passwordMatchError && (
        <Typography variant="caption" color="error">
          {t('settings.security.passwordMatchError')}
        </Typography>
      )}
    </SecuritySettingsContainer>
  );
};

export default SecuritySettings;
