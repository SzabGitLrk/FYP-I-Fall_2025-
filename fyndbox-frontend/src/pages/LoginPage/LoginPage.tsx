import { FC, useEffect, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isEmailValid, isPasswordNonEmpty } from '../../utils/validation';
import AuthButtonsGroup from '../../components/AuthButtonsGroup/AuthButtonsGroup';
import CustomTextField from '../../components/CustomTextField/CustomTextField';
import { CustomLink } from '../../styles/commonStyles';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import appLogo from '../../assets/FyndBox.png';
import {
  BrandBlock,
  DecorativeLayer,
  ErrorText,
  FieldStack,
  ForgotPasswordLink,
  LanguageWrap,
  LoginCard,
  LoginContent,
  LoginPageShell,
  LoginTitle,
  SoftCircle,
} from './LoginPage.styles';

const LoginPage: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, error, setError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    setError(null);
  }, []);

  const handleLoginClick = async () => {
    setEmailError(!isEmailValid(email));
    setPasswordError(!isPasswordNonEmpty(password));

    if (isEmailValid(email) && isPasswordNonEmpty(password)) {
      const success = await login(email, password);

      if (success) {
        navigate('/dashboard');
      }
    }
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <LoginPageShell>
      <DecorativeLayer />
      <SoftCircle placement="top" />
      <SoftCircle placement="left" />
      <SoftCircle placement="right" />

      <LoginContent>
        <BrandBlock>
          <img src={appLogo} alt="FyndBox" />
          <span>FyndBox</span>
        </BrandBlock>

        <LoginCard>
          <Box
            component="form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleLoginClick();
            }}
          >
            <LoginTitle variant="h1">{t('login.title')}</LoginTitle>
            <FieldStack>
              <CustomTextField
                label={t('common.email.label')}
                type="email"
                placeholder={t('common.email.placeholder')}
                value={email}
                onChange={(e) => {
                  setEmailError(false);
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                error={emailError}
                helperText={emailError ? t('common.email.errorMessage') : ''}
                startIcon={<Email />}
              />
              <CustomTextField
                label={t('common.password.label')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                  if (error) setError(null);
                }}
                error={passwordError}
                helperText={
                  passwordError ? t('common.password.passwordRequiredError') : ''
                }
                startIcon={<Lock />}
                endIcon={
                  <IconButton
                    onClick={togglePasswordVisibility}
                    aria-label="toggle password visibility"
                    edge="end"
                  >
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
            <AuthButtonsGroup
              onLoginClick={handleLoginClick}
              onRegisterClick={handleSignupClick}
            />
            <ForgotPasswordLink variant="body2">
              <CustomLink href="/forgot-password">
                {t('login.forgotPassword')}
              </CustomLink>
            </ForgotPasswordLink>
          </Box>
        </LoginCard>
        <LanguageWrap>
          <LanguageSelector compact />
        </LanguageWrap>
      </LoginContent>
    </LoginPageShell>
  );
};

export default LoginPage;
