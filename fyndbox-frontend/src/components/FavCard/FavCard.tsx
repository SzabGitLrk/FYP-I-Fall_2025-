import { FC } from 'react';
import { Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import BoxIconSvg from '../../assets/box-icon-black.svg';
import {
  FavCardContainer,
  FavoriteCardContent,
  FavoriteCardImage,
  FavoriteCardText,
  FavoriteDeleteButton,
} from './FavCard.styles';

interface FavCardProps {
  name: string;
  image: string;
  description?: string;
  onDelete: () => void;
  onClick: () => void;
}

const FavCard: FC<FavCardProps> = ({
  name,
  image,
  description,
  onDelete,
  onClick,
}) => {
  return (
    <FavCardContainer onClick={onClick}>
      <FavoriteCardContent>
        {image ? (
          <FavoriteCardImage src={image} alt={name} />
        ) : (
          <FavoriteCardImage src={BoxIconSvg} alt={'Box Icon'} />
        )}
        <FavoriteCardText>
          <Typography variant="h6">{name}</Typography>
          <Typography variant="body1">{description}</Typography>
        </FavoriteCardText>
      </FavoriteCardContent>
      <FavoriteDeleteButton
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Remove favorite"
      >
        <Delete />
      </FavoriteDeleteButton>
    </FavCardContainer>
  );
};

export default FavCard;
