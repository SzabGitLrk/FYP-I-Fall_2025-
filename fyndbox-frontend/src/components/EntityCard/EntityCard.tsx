import { FC, ReactNode } from 'react';
import { CardContent, Typography, IconButton, Stack, Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
import StorageIconSvg from '../../assets/storage-icon.svg';
import BoxIconSvg from '../../assets/box-icon.svg';
import { CustomIcon } from '../../styles/commonStyles';
import { EntityCardContainer, ImageBox } from './EntityCard.styles';
import { EntityType } from '../../types/entityTypes';
import { useTranslation } from 'react-i18next';

interface EntityCardProps {
  name: string;
  description?: string;
  quantity?: number;
  iconButton?: ReactNode;
  entityType?: EntityType;
  image?: string;
  onEdit?: () => void;
}

const EntityCard: FC<EntityCardProps> = ({
  name,
  description,
  quantity,
  iconButton,
  entityType = 'storage',
  image,
  onEdit,
}) => {
  const { t } = useTranslation();
  const getEntityIcon = (entityType: EntityType): string => {
    switch (entityType) {
      case 'box':
        return BoxIconSvg;
      case 'item':
        return BoxIconSvg; // replace with item icon
      default:
        return StorageIconSvg;
    }
  };

  // Clean display text to avoid odd spacing.
  const displayName = name.trim().replace(/\s+/g, ' ');
  const displayDescription = description?.trim();

  return (
    <EntityCardContainer isBoxCard={entityType === 'box'}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box flex={1}>
            {image ? (
              <ImageBox src={image} alt={name} />
            ) : (
              <ImageBox
                src={getEntityIcon(entityType)}
                alt={
                  entityType === 'box'
                    ? 'Box Icon'
                    : entityType === 'item'
                      ? 'Item Icon'
                      : 'Storage Icon'
                }
              />
            )}
          </Box>

          {/* Allow long names to wrap within the card. */}
          <Box flex={3} minWidth={0}>
            <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
              {displayName}
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {displayDescription}
            </Typography>
          </Box>

          {entityType === 'item' && (
            <Box flex={1}>
              <Typography variant="h6">
                {quantity! > 1
                  ? t('modal.quantity.piece_plural', { count: quantity })
                  : t('modal.quantity.piece', { count: quantity })}
              </Typography>
            </Box>
          )}

          <Box flex={1}>
            <Stack direction="row" spacing={1}>
              <IconButton onClick={onEdit}>
                <CustomIcon>
                  <Edit />
                </CustomIcon>
              </IconButton>
              {iconButton && iconButton}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </EntityCardContainer>
  );
};

export default EntityCard;
