import { Fab, keyframes, styled } from '@mui/material';
import { CSSObject } from '@mui/material/styles';

interface StyledSmartAssistButtonProps {
  $placement?: 'floating' | 'inline';
}

// Pulsing glow animation
const pulseGlow = keyframes`
  0% {
    box-shadow: 0 16px 34px rgba(7, 81, 47, 0.30), 0 5px 14px rgba(7, 81, 47, 0.18), 0 0 0 0 rgba(18, 128, 75, 0.7);
  }
  50% {
    box-shadow: 0 16px 34px rgba(7, 81, 47, 0.30), 0 5px 14px rgba(7, 81, 47, 0.18), 0 0 0 12px rgba(18, 128, 75, 0);
  }
  100% {
    box-shadow: 0 16px 34px rgba(7, 81, 47, 0.30), 0 5px 14px rgba(7, 81, 47, 0.18), 0 0 0 0 rgba(18, 128, 75, 0.7);
  }
`;

// Shimmer animation for the gradient
const shimmer = keyframes`
  0% {
    background: linear-gradient(135deg, rgba(18, 128, 75, 0.98) 0%, rgba(7, 81, 47, 0.98) 100%);
  }
  50% {
    background: linear-gradient(135deg, rgba(21, 145, 85, 0.98) 0%, rgba(12, 95, 55, 0.98) 100%);
  }
  100% {
    background: linear-gradient(135deg, rgba(18, 128, 75, 0.98) 0%, rgba(7, 81, 47, 0.98) 100%);
  }
`;

// Sparkle badge bounce animation
const sparkleBounce = keyframes`
  0%, 100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) translateY(-4px);
    opacity: 0.9;
  }
`;

export const FABWrapper = styled('div')(() => ({
  position: 'relative',
  display: 'inline-block',
  width: 64,
  height: 64,
}));

export const SparkleBadge = styled('div')(() => ({
  position: 'absolute',
  top: '-6px',
  right: '-6px',
  fontSize: '28px',
  lineHeight: 1,
  zIndex: 10,
  animation: `${sparkleBounce} 2s ease-in-out infinite`,
  userSelect: 'none',
  pointerEvents: 'none',
  filter: 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6))',
}));

export const StyledSmartAssistButton = styled(Fab, {
  shouldForwardProp: (prop) => prop !== '$placement',
})<StyledSmartAssistButtonProps>(({ theme, $placement = 'floating' }) => {
  const isFloating = $placement === 'floating';

  return {
    position: isFloating ? 'fixed' : 'relative',
    right: isFloating ? theme.spacing(2.5) : 'auto',
    bottom: isFloating
      ? `calc(${theme.spacing(2.8)} + env(safe-area-inset-bottom, 0px))`
      : 'auto',
    zIndex: isFloating ? 1200 : 0,

    width: 64,
    height: 64,
    minHeight: 64,

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    background: isFloating
      ? 'linear-gradient(135deg, rgba(18, 128, 75, 0.98) 0%, rgba(7, 81, 47, 0.98) 100%)'
      : theme.palette.secondary.contrastText,
    color: isFloating ? theme.palette.common.white : theme.palette.secondary.main,
    border: isFloating ? '2px solid rgba(255, 255, 255, 0.34)' : 'none',
    boxShadow: isFloating
      ? '0 16px 34px rgba(7, 81, 47, 0.30), 0 5px 14px rgba(7, 81, 47, 0.18)'
      : '0 4px 12px rgba(0, 0, 0, 0.12)',

    '& .MuiSvgIcon-root': {
      width: 36,
      height: 36,
      strokeWidth: 2.8,
      color: isFloating ? '#ffffff' : 'inherit',
      fill: isFloating ? '#ffffff' : 'inherit',
      position: 'relative',
      zIndex: 1,
    },

    transition:
      'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease, background-color 200ms ease',

    animation: isFloating ? `${pulseGlow} 3s ease-in-out infinite` : 'none',

    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      background: isFloating
        ? 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)'
        : 'none',
      animation: isFloating ? `${shimmer} 3s ease-in-out infinite` : 'none',
      pointerEvents: 'none',
    },

    '&:hover': {
      transform: 'translateY(-2px) scale(1.04)',
      backgroundColor: isFloating
        ? theme.palette.primary.dark
        : theme.palette.grey[700],
      boxShadow: '0 20px 44px rgba(7, 81, 47, 0.36), 0 7px 18px rgba(7, 81, 47, 0.22)',
    },

    '&:active': {
      transform: 'scale(0.96)',
    },

    '&.Mui-disabled': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.grey[500],
      borderColor: theme.palette.grey[300],
      boxShadow: 'none',
      animation: 'none',
    },

    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  } as CSSObject;
});
