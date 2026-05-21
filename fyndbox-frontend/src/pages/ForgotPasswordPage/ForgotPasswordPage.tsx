import { FC, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CustomTextField from '../../components/CustomTextField/CustomTextField';
import { CustomLink } from '../../styles/commonStyles';
import { useTranslation } from 'react-i18next';
import { Email } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { isEmailValid } from '../../utils/validation';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import {
  ForgotPasswordBody,
  ForgotPasswordDescription,
  SendButton,
} from './ForgotPasswordPage.styles';
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

const ForgotPasswordPage: FC = () => {
  const { t } = useTranslation();
  const { forgotPassword, error, setError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendEmail = async () => {
    setEmailError(!isEmailValid(email));

    if (isEmailValid(email)) {
      setError(null);
      try {
        const success = await forgotPassword(email);
        if (success) {
          setSuccessMessage(t('api.auth.forgotPassword.success'));
          setEmail('');
        }
      } catch (err) {
        setSuccessMessage('');
      }
    }
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
              handleSendEmail();
            }}
          >
            <ForgotPasswordBody>
              <LoginTitle variant="h1">{t('forgotPassword.title')}</LoginTitle>
              {loading && <Typography variant="body1">Loading...</Typography>}
              {successMessage && (
                <Typography variant="caption" color="info">
                  {successMessage}
                </Typography>
              )}
              <ForgotPasswordDescription variant="body1">
                {t('forgotPassword.description')}
              </ForgotPasswordDescription>
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
              </FieldStack>
              <SendButton variant="contained" type="submit">
                {t('forgotPassword.submit')}
              </SendButton>
              {error && (
                <ErrorText variant="caption" color="error">
                  {error}
                </ErrorText>
              )}
              <ForgotPasswordLink variant="body2">
                <CustomLink href="/login" underline="always">
                  {t('forgotPassword.backToLogin')}
                </CustomLink>
              </ForgotPasswordLink>
            </ForgotPasswordBody>
          </Box>
        </LoginCard>

        <LanguageWrap>
          <LanguageSelector compact />
        </LanguageWrap>
      </LoginContent>
    </LoginPageShell>
  );
};

export default ForgotPasswordPage;
