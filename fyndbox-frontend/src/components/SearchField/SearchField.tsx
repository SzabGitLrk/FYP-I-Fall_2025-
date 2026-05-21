import { FC, useState } from 'react';
import { IconButton, InputAdornment } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import {
  SearchFieldContainer,
  SearchIconButton,
  SearchTextField,
} from './SearchField.styles';

interface SearchFieldProps {
  onSearch: (query: string) => void;
}

const SearchField: FC<SearchFieldProps> = ({ onSearch }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchClick = () => {
    console.log(searchQuery);
    onSearch(searchQuery.trim()); // Trigger the search with the trimmed query
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch(searchQuery.trim()); // Trigger the search on Enter key press
    }
  };

  const handleClearClick = () => {
    setSearchQuery(''); // Clear the search query
    onSearch(''); // Reset the search results
  };

  return (
    <SearchFieldContainer>
      <SearchTextField
        variant="outlined"
        placeholder={t('dashboard.search.placeholder')}
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyUp={handleKeyPress}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchQuery && (
                  <>
                    <IconButton onClick={handleClearClick}>
                      <Clear />
                    </IconButton>
                    <SearchIconButton
                      onClick={handleSearchClick}
                      disabled={!searchQuery}
                      disableRipple
                    >
                      <Search />
                    </SearchIconButton>
                  </>
                )}
              </InputAdornment>
            ),
          },
        }}
      />
    </SearchFieldContainer>
  );
};

export default SearchField;
