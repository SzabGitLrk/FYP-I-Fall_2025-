import { FC, ReactNode } from 'react';
import { CardContent, IconButton, Stack, Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
import StorageIconSvg from '../../assets/storage-icon.svg';
import BoxIconSvg from '../../assets/box-icon.svg';
import ItemIconSvg from '../../assets/item-icon.svg';
import { CustomIcon } from '../../styles/commonStyles';
import {
  ContentBox,
  DescriptionText,
  EntityCardContainer,
  ImageBox,
  MetaChip,
  MetaRow,
  NameText,
  QuantityText,
} from './EntityCard.styles';
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
  metaItems?: Array<{
    icon: ReactNode;
    label: string;
  }>;
}

const EntityCard: FC<EntityCardProps> = ({
  name,
  description,
  quantity,
  iconButton,
  entityType = 'storage',
  image,
  onEdit,
  metaItems,
}) => {
  const { t } = useTranslation();
  const getEntityIcon = (entityType: EntityType): string => {
    switch (entityType) {
      case 'box':
        return BoxIconSvg;
      case 'item':
        return ItemIconSvg;
      default:
        return StorageIconSvg;
    }
  };

  return (
    <EntityCardContainer isBoxCard={entityType === 'box'}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box flex={1}>
            {image && entityType !== 'item' ? (
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

          <ContentBox>
            <NameText variant="h6">{name}</NameText>
            <DescriptionText variant="body1">{description}</DescriptionText>
            {metaItems && metaItems.length > 0 && (
              <MetaRow>
                {metaItems.map((item, index) => (
                  <MetaChip key={`${item.label}-${index}`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </MetaChip>
                ))}
              </MetaRow>
            )}
          </ContentBox>

          {entityType === 'item' && (
            <Box flex="0 0 auto">
              <QuantityText variant="h6">
                {quantity! > 1
                  ? t('modal.quantity.piece_plural', { count: quantity })
                  : t('modal.quantity.piece', { count: quantity })}
              </QuantityText>
            </Box>
          )}

          <Box flex="0 0 auto" ml={entityType === 'item' ? 3 : 0}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              {iconButton && iconButton}
              <IconButton onClick={onEdit}>
                <CustomIcon>
                  <Edit />
                </CustomIcon>
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </EntityCardContainer>
  );
};

export default EntityCard;
