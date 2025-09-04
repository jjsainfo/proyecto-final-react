import React, { useState, ChangeEvent } from 'react';
import './SearchBar.css';

// Props interface for SearchBar component
interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

function SearchBar({ onSearch, isLoading = false, disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState<string>('');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="search-input-container">
      <h1>Pokemon name: </h1>
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input 
            type="text" 
            placeholder="Search Pokemons!" 
            className="search-input"
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled || isLoading}
          />
          
          {/* Clear button */}
          {query && (
            <button 
              type="button" 
              className="clear-button"
              onClick={clearSearch}
              disabled={isLoading}
            >
              ✕
            </button>
          )}
          
          {/* Search button */}
          <button 
            type="submit" 
            className="search-button"
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? '⏳' : '🔍'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;