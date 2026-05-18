import { FC } from 'react';
import { IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Box as FavBox } from '../../types/box';
import { useUpdateBox } from '../../hooks/useBox';
import FavCard from '../FavCard/FavCard';
import { useTranslation } from 'react-i18next';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIllustration,
  EmptyStateTitle,
  FavoritesDrawer,
  FavoritesHeader,
  FavoritesList,
  HeaderSpacer,
  HeaderTitle,
} from './FavoritesSidebar.styles';

const FavoritesSidebar: FC<{
  open: boolean;
  favorites: FavBox[] | undefined;
  onClose: () => void;
}> = ({ open, favorites, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: updateBox } = useUpdateBox();

  const handleBoxOpen = (storageId: string, boxId: string) => {
    navigate(`/box/${storageId}/${boxId}`);
    onClose();
  };

  const handleToggleFavorite = (box: FavBox) => {
    if (box && box.storageId) {
      updateBox({
        boxId: box.id,
        storageId: box.storageId,
        boxData: {
          ...box,
          isFavorite: !box.isFavorite,
        },
      });
    }
  };

  return (
    <FavoritesDrawer anchor="right" open={open} onClose={onClose}>
      <FavoritesHeader>
        <IconButton onClick={onClose} aria-label={t('common.back')}>
          <ArrowBack />
        </IconButton>
        <HeaderTitle variant="h6">
          {t('favoritesSidebar.title')}
        </HeaderTitle>
        <HeaderSpacer />
      </FavoritesHeader>
      {favorites && favorites.length > 0 ? (
        <FavoritesList>
          {favorites.map((box, boxIndex) => (
            <FavCard
              key={boxIndex}
              name={box.name}
              description={box.description || ''}
              image={box.image || ''}
              onDelete={() => handleToggleFavorite(box)}
              onClick={() => handleBoxOpen(box.storageId!!, box.id)}
            />
          ))}
        </FavoritesList>
      ) : (
        <EmptyState>
          <EmptyStateIllustration
            viewBox="0 0 160 150"
            role="img"
            aria-label={t('favoritesSidebar.noItemsFound')}
          >
            <ellipse cx="80" cy="132" rx="38" ry="10" fill="#DDE8E0" />
            <path
              d="M52 83h56v39l-28 9-28-9V83Z"
              fill="#6AA47C"
              stroke="#174D38"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M52 83 29 72l28-12 23 10-28 13Z"
              fill="#D6E5DA"
              stroke="#174D38"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="m108 83 23-11-28-12-23 10 28 13Z"
              fill="#D6E5DA"
              stroke="#174D38"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M52 83 80 70l28 13-28 13-28-13Z"
              fill="#7FB58D"
              stroke="#174D38"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M52 83 33 98l31 8 16-14-28-9Z"
              fill="#BFD7C5"
              stroke="#174D38"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="m108 83 19 15-31 8-16-14 28-9Z"
              fill="#BFD7C5"
              stroke="#174D38"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M80 40c-7-10-21-2-18 9 2 7 11 13 18 19 7-6 16-12 18-19 3-11-11-19-18-9Z"
              fill="#97B99F"
              stroke="#174D38"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M88 114h10M88 120h6"
              stroke="#174D38"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </EmptyStateIllustration>
          <EmptyStateTitle variant="h6">
            {t('favoritesSidebar.noItemsFound')}
          </EmptyStateTitle>
          <EmptyStateDescription variant="body2">
            {t('favoritesSidebar.emptyDescription', {
              defaultValue: 'Items you favorite will appear here.',
            })}
          </EmptyStateDescription>
        </EmptyState>
      )}
    </FavoritesDrawer>
  );
};

export default FavoritesSidebar;
