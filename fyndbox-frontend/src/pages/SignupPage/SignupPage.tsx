import { Box, IconButton, Typography } from '@mui/material';
import {
  Email,
  Lock,
  AccountCircle,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import {
  isEmailValid,
  isNameValid,
  isPasswordValid,
} from '../../utils/validation';
import AuthButtonsGroup from '../../components/AuthButtonsGroup/AuthButtonsGroup';
import CustomTextField from '../../components/CustomTextField/CustomTextField';
import {
  CustomLink,
} from '../../styles/commonStyles';
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
} from '../LoginPage/LoginPage.styles';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signup, error, setError, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setError(null);
  }, []);

  const handleSignupClick = async () => {
    setNameError(!isNameValid(name));
    setEmailError(!isEmailValid(email));
    setPasswordError(!isPasswordValid(password));

    if (isNameValid(name) && isEmailValid(email) && isPasswordValid(password)) {
      const success = await signup(name, email, password);
      if (success) {
        setSuccessMessage(t('signup.sendEmailMessage'));
        navigate('/dashboard');
      }
    }
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
              handleSignupClick();
            }}
          >
            <LoginTitle variant="h1">{t('signup.title')}</LoginTitle>
            {loading && <Typography variant="body1">Loading...</Typography>}
            {successMessage && (
              <Typography variant="caption" color="info">
                {successMessage}
              </Typography>
            )}
            <FieldStack>
              <CustomTextField
                label={t('common.name.label')}
                placeholder={t('common.name.placeholder')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(false);
                  if (error) setError(null);
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(false);
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
                  passwordError
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
              showLoginButton={false}
              onRegisterClick={handleSignupClick}
            />
            <ForgotPasswordLink variant="body2">
              <CustomLink href="/login">
                {t('forgotPassword.backToLogin')}
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

export default SignupPage;
