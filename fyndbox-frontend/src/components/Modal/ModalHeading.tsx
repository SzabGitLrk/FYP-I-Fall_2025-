import React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { EntityType } from '../../types/entityTypes';

interface ModalHeadingProps {
  mode: 'add' | 'edit';
  type: EntityType;
}

// Restored shared modal heading component so EntityActionModal can resolve its local import again.
const ModalHeading: React.FC<ModalHeadingProps> = ({ mode, type }) => {
  const { t } = useTranslation();

  // Keep add/edit heading text centralized through the existing translation keys.
  const headingText =
    mode === 'add'
      ? t('modal.add', { type: t(`types.${type}`) })
      : t('modal.edit', { type: t(`types.${type}`) });

  return (
    <Typography variant="h3" sx={{ lineHeight: '3.5', fontWeight: 'bold' }}>
      {headingText}
    </Typography>
  );
};

export default ModalHeading;
