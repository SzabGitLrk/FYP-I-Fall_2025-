import { FC } from 'react';
import { IconButton } from '@mui/material';
import { FavoriteBorder, Favorite } from '@mui/icons-material';
import {
  BoxDetailsContainer,
  DetailsChip,
  DetailsContent,
  DetailsDescription,
  DetailsMeta,
  DetailsTitle,
  FavoriteButtonWrap,
  ImageBox,
  ImageContainer,
} from './BoxDetails.styles';
import BoxIconSvg from '../../assets/box-icon.svg';
import ItemIconSvg from '../../assets/item-icon.svg';
import { useTranslation } from 'react-i18next';

interface BoxDetailsProps {
  name: string;
  description?: string;
  image?: string;
  isFavorite?: boolean;
  itemCount?: number;
  onToggleFavorite: () => void;
}

const BoxDetails: FC<BoxDetailsProps> = ({
  name,
  description,
  image,
  isFavorite,
  itemCount = 0,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();
  return (
    <BoxDetailsContainer>
      <ImageContainer>
        {image ? (
          <ImageBox src={image} alt={name} />
        ) : (
          <ImageBox src={BoxIconSvg} alt={'Box Icon'} />
        )}
      </ImageContainer>
      <DetailsContent>
        <DetailsTitle>{name}</DetailsTitle>
        <DetailsDescription>
          {description ||
            t('box.defaultDescription', {
              defaultValue: `Manage your items in ${name}.`,
            })}
        </DetailsDescription>
        <DetailsMeta>
          <DetailsChip
            icon={
              <img
                src={ItemIconSvg}
                alt="Items"
                style={{ width: 18, height: 18 }}
              />
            }
            label={t('box.itemCount', {
              count: itemCount,
              defaultValue: `${itemCount} Items`,
            })}
          />
        </DetailsMeta>
      </DetailsContent>
      <FavoriteButtonWrap>
        <IconButton onClick={onToggleFavorite}>
          {isFavorite ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
      </FavoriteButtonWrap>
    </BoxDetailsContainer>
  );
};

export default BoxDetails;
