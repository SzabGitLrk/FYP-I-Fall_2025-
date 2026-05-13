import React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { EntityType } from '../../types/entityTypes';

interface ModalHeadingProps {
  mode: 'add' | 'edit';
  type: EntityType;
}

const ModalHeading: React.FC<ModalHeadingProps> = ({ mode, type }) => {
  const { t } = useTranslation();
  const headingText =
    mode === 'add'
      ? t('modal.add', { type: t(`types.${type}`) })
      : t('modal.edit', { type: t(`types.${type}`) });

  return (
    <Typography
      variant="h4"
      sx={{ lineHeight: 1.3, fontWeight: 700, mb: 1.25, mt: 0.5 }}
    >
      {headingText}
    </Typography>
  );
};

export default ModalHeading;
