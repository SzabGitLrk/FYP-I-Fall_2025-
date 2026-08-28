import { FC, useEffect, useState } from 'react';
import { Box, CardContent, IconButton } from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomTextField from '../../components/CustomTextField/CustomTextField';
import { CustomLink } from '../../styles/commonStyles';
import { useAuth } from '../../hooks/useAuth';
import {
  ResetPasswordPageShell,
  DecorativeLayer,
  SoftCircle,
  ResetPasswordContent,
  BrandBlock,
  ResetPasswordCard,
  ResetPasswordTitle,
  ResetPasswordDescription,
  FieldStack,
  ButtonContainer,
  ErrorCard,
  ErrorCardContainer,
  SendButton,
  ErrorText,
  BackToLoginLink,
  LanguageWrap,
} from './ResetPasswordPage.styles';
import { isPasswordNonEmpty, isPasswordValid } from '../../utils/validation';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import appLogo from '../../assets/FyndBox.png';

const ResetPasswordPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const email = searchParams.get('email');
  const { resetPassword, validateResetToken, error, setError, loading } =
    useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    const checkTokenValidity = async () => {
      if (email && resetToken) {
        const isTokenValid = await validateResetToken(email, resetToken);
        if (isTokenValid) {
          setTokenError(false);
        } else {
          setTokenError(true);
        }
      }
    };

    checkTokenValidity();
  }, [email, resetToken]);

  const handleResetPassword = async () => {
    if (tokenError) return;
    const isNewPasswordValid = isPasswordValid(newPassword);
    const isConfirmPasswordValid = isPasswordNonEmpty(confirmPassword);
    const doPasswordsMatch = newPassword === confirmPassword;

    setNewPasswordError(!isNewPasswordValid);
    setPasswordMatchError(!doPasswordsMatch);

    if (isNewPasswordValid && isConfirmPasswordValid && doPasswordsMatch) {
      const success = await resetPassword(email!, resetToken!, newPassword);

      if (success) {
        navigate('/login');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ResetPasswordPageShell>
      <DecorativeLayer />
      <SoftCircle placement="top" />
      <SoftCircle placement="left" />
      <SoftCircle placement="right" />

      <ResetPasswordContent>
        <BrandBlock>
          <img src={appLogo} alt="FyndBox" />
          <span>FyndBox</span>
        </BrandBlock>

        {tokenError ? (
          <ErrorCardContainer>
            <ErrorCard>
              <CardContent>
                {t('resetPassword.error.tokenInvalidOrUsed')}
              </CardContent>
            </ErrorCard>
            <BackToLoginLink variant="body2">
              <CustomLink href="/login">
                {t('forgotPassword.backToLogin')}
              </CustomLink>
            </BackToLoginLink>
          </ErrorCardContainer>
        ) : (
          <ResetPasswordCard>
            <Box
              component="form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                handleResetPassword();
              }}
            >
              <ResetPasswordTitle variant="h1">
                {t('resetPassword.title')}
              </ResetPasswordTitle>
              <ResetPasswordDescription variant="body1">
                {t('resetPassword.description')}
              </ResetPasswordDescription>
              <FieldStack>
                <CustomTextField
                  label={t('resetPassword.newPassword.label')}
                  placeholder={t('resetPassword.newPassword.placeholder')}
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setNewPasswordError(false);
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
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  }
                />
                <CustomTextField
                  label={t('resetPassword.confirmPassword.label')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('resetPassword.confirmPassword.placeholder')}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPasswordError(false);
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  error={confirmPasswordError || passwordMatchError}
                  helperText={
                    confirmPasswordError
                      ? t('common.password.passwordRequiredError')
                      : passwordMatchError
                      ? t('resetPassword.error.mismatch')
                      : ''
                  }
                  startIcon={<Lock />}
                  endIcon={
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  }
                />
              </FieldStack>
              {error && (
                <ErrorText variant="caption" color="error">
                  {error}
                </ErrorText>
              )}
              <ButtonContainer>
                <SendButton as="button" type="submit">
                  {t('resetPassword.submit')}
                </SendButton>
              </ButtonContainer>
              <BackToLoginLink variant="body2">
                <CustomLink href="/login">
                  {t('forgotPassword.backToLogin')}
                </CustomLink>
              </BackToLoginLink>
            </Box>
          </ResetPasswordCard>
        )}

        <LanguageWrap>
          <LanguageSelector compact />
        </LanguageWrap>
      </ResetPasswordContent>
    </ResetPasswordPageShell>
  );
};

export default ResetPasswordPage;
