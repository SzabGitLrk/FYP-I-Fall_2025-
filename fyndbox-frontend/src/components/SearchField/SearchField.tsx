import { FC, useState } from 'react';
import { IconButton, InputAdornment } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import {
  SearchFieldContainer,
  SearchTextField,
} from './SearchField.styles';

interface SearchFieldProps {
  onSearch: (query: string) => void;
  value?: string;
  onChange?: (value: string) => void;
}

const SearchField: FC<SearchFieldProps> = ({ onSearch, value: externalValue, onChange }) => {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState('');

  // Use external value if provided, otherwise use internal state
  const searchQuery = externalValue !== undefined ? externalValue : internalValue;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Update state - keep spaces as user types
    if (externalValue === undefined) {
      setInternalValue(value);
    } else if (onChange) {
      // If controlled, notify parent of the change (keep spaces)
      onChange(value);
    }
    
    // Trigger search when criteria met (2+ chars or empty)
    // Don't trim here - let the user type spaces
    if (value.trim().length >= 2 || value.trim().length === 0) {
      onSearch(value); // Pass full value with spaces
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchQuery.trim().length >= 2) {
      onSearch(searchQuery); // Keep spaces
    }
  };

  const handleClearClick = () => {
    if (externalValue === undefined) {
      setInternalValue('');
    } else if (onChange) {
      onChange('');
    }
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
                  <IconButton onClick={handleClearClick}>
                    <Clear />
                  </IconButton>
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
