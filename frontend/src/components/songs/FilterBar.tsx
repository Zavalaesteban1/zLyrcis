import React from 'react';
import styled from 'styled-components';

const FilterBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
`;

const FilterOptions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const FilterOption = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(29, 185, 84, 0.1)' : 'transparent'};
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: ${props => props.active ? '#1DB954' : '#666'};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(29, 185, 84, 0.1);
    color: #1DB954;
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #1DB954;
    outline: none;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.1);
  }
`;

interface FilterBarProps {
  filter: 'all' | 'learned' | 'not-learned' | 'favorites';
  searchTerm: string;
  onFilterChange: (filter: 'all' | 'learned' | 'not-learned' | 'favorites') => void;
  onSearchChange: (searchTerm: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  searchTerm,
  onFilterChange,
  onSearchChange
}) => {
  return (
    <FilterBarContainer>
      <FilterOptions>
        <FilterOption
          active={filter === 'favorites'}
          onClick={() => onFilterChange('favorites')}
        >
          Favorite Songs
        </FilterOption>
        <FilterOption
          active={filter === 'all'}
          onClick={() => onFilterChange('all')}
        >
          Unlearned Songs
        </FilterOption>
        <FilterOption
          active={filter === 'learned'}
          onClick={() => onFilterChange('learned')}
        >
          Learned
        </FilterOption>
        <FilterOption
          active={filter === 'not-learned'}
          onClick={() => onFilterChange('not-learned')}
        >
          Still Learning
        </FilterOption>
      </FilterOptions>
      <SearchInput
        type="text"
        placeholder="Search songs..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </FilterBarContainer>
  );
};
