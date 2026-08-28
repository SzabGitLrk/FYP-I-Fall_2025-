import { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { Inventory2Outlined, LocalOfferOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SearchResults as SearchResultsType } from '../../types/searchResults';
import EntityCard from '../EntityCard/EntityCard';
import BoxIconSvg from '../../assets/box-icon.svg';
import ItemIconSvg from '../../assets/item-icon.svg';

interface SearchResultsProps {
  results: SearchResultsType;
  isLoading: boolean;
}

const SearchResults: FC<SearchResultsProps> = ({ results, isLoading }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={3}>
        <Typography variant="body1">
          {t('common.loading', { defaultValue: 'Loading...' })}
        </Typography>
      </Box>
    );
  }

  if (results.totalResults === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        py={2}
        gap={1}
      >
        <Typography variant="body1" textAlign="left" color="textSecondary" fontWeight={600}>
          {t('dashboard.search.noResults', {
            keyword: results.keyword,
            defaultValue: `No results found for "${results.keyword}"`,
          })}
        </Typography>
        <Typography variant="body2" textAlign="left" color="textSecondary">
          {t('dashboard.search.tryDifferent', {
            defaultValue: 'Try a different search term or browse all items',
          })}
        </Typography>
      </Box>
    );
  }

  const handleItemClick = (storageId: string, boxId: string, itemId: string) => {
    navigate(`/storage/${storageId}/box/${boxId}/item/${itemId}`);
  };

  const handleBoxClick = (storageId: string, boxId: string) => {
    navigate(`/storage/${storageId}/box/${boxId}`);
  };

  const handleStorageClick = (storageId: string) => {
    navigate(`/storage/${storageId}`);
  };

  return (
    <Box>
      {/* Items Section */}
      {results.items.length > 0 && (
        <Box mb={4}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              pb: 1,
              borderBottom: '2px solid',
              borderColor: 'primary.main',
            }}
          >
            <LocalOfferOutlined sx={{ color: 'primary.main' }} />
            <Typography
              variant="h6"
              sx={{ color: 'primary.dark', fontWeight: 700 }}
            >
              {t('dashboard.search.foundInItems', {
                count: results.items.length,
                defaultValue: `Found in Items (${results.items.length})`,
              })}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {results.items.map((item) => (
              <EntityCard
                key={item.id}
                name={item.name}
                description={item.description ?? ''}
                image={item.image ?? ''}
                metaItems={[
                  {
                    icon: (
                      <Inventory2Outlined
                        sx={{ width: 18, height: 18, color: 'text.secondary' }}
                      />
                    ),
                    label: item.storageName,
                  },
                  {
                    icon: (
                      <img
                        src={BoxIconSvg}
                        alt="Box"
                        style={{ width: 18, height: 18 }}
                      />
                    ),
                    label: item.boxName,
                  },
                ]}
                entityType="item"
                onClick={() => handleItemClick(item.storageId, item.boxId, item.id)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Boxes Section */}
      {results.boxes.length > 0 && (
        <Box mb={4}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              pb: 1,
              borderBottom: '2px solid',
              borderColor: 'primary.main',
            }}
          >
            <img
              src={BoxIconSvg}
              alt="Box"
              style={{ width: 24, height: 24 }}
            />
            <Typography
              variant="h6"
              sx={{ color: 'primary.dark', fontWeight: 700 }}
            >
              {t('dashboard.search.foundInBoxes', {
                count: results.boxes.length,
                defaultValue: `Found in Boxes (${results.boxes.length})`,
              })}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {results.boxes.map((box) => (
              <EntityCard
                key={box.id}
                name={box.name}
                description={box.description ?? ''}
                image={box.image ?? ''}
                metaItems={[
                  {
                    icon: (
                      <Inventory2Outlined
                        sx={{ width: 18, height: 18, color: 'text.secondary' }}
                      />
                    ),
                    label: box.storageName,
                  },
                  {
                    icon: (
                      <img
                        src={ItemIconSvg}
                        alt="Items"
                        style={{ width: 18, height: 18 }}
                      />
                    ),
                    label: t('dashboard.entity.itemCount', {
                      count: box.itemCount,
                      defaultValue:
                        box.itemCount === 1 ? `1 Item` : `${box.itemCount} Items`,
                    }),
                  },
                ]}
                entityType="box"
                onClick={() => handleBoxClick(box.storageId, box.id)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Storages Section */}
      {results.storages.length > 0 && (
        <Box mb={4}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              pb: 1,
              borderBottom: '2px solid',
              borderColor: 'primary.main',
            }}
          >
            <Inventory2Outlined sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{ color: 'primary.dark', fontWeight: 700 }}
            >
              {t('dashboard.search.foundInStorages', {
                count: results.storages.length,
                defaultValue: `Found in Storages (${results.storages.length})`,
              })}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={2}>
            {results.storages.map((storage) => (
              <EntityCard
                key={storage.id}
                name={storage.name}
                description={storage.description ?? ''}
                image={storage.image ?? ''}
                metaItems={[
                  {
                    icon: (
                      <img
                        src={BoxIconSvg}
                        alt="Boxes"
                        style={{ width: 18, height: 18 }}
                      />
                    ),
                    label: t('dashboard.entity.boxCount', {
                      count: storage.boxCount,
                      defaultValue:
                        storage.boxCount === 1
                          ? `1 Box`
                          : `${storage.boxCount} Boxes`,
                    }),
                  },
                  {
                    icon: (
                      <img
                        src={ItemIconSvg}
                        alt="Items"
                        style={{ width: 18, height: 18 }}
                      />
                    ),
                    label: t('dashboard.entity.itemCount', {
                      count: storage.itemCount,
                      defaultValue:
                        storage.itemCount === 1
                          ? `1 Item`
                          : `${storage.itemCount} Items`,
                    }),
                  },
                ]}
                entityType="storage"
                onClick={() => handleStorageClick(storage.id)}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SearchResults;
