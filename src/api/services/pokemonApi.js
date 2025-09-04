// PokemonAPI Service - Centralized service for managing Pokemon API interactions.
// Includes error handling, caching, and loading states.

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds.
const cache = new Map();

// Loading states management.
let loadingStates = {
  searchPokemon: false,
  getPokemonList: false,
  getPokemonSpecies: false
};

// Loading state subscribers.
const loadingStateSubscribers = new Set();

// Custom error classes.
export class PokemonAPIError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'PokemonAPIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

export class NetworkError extends Error {
  constructor(message, endpoint) {
    super(message);
    this.name = 'NetworkError';
    this.endpoint = endpoint;
  }
}

// Loading state management functions.
export const subscribeToLoadingState = (callback) => {
  loadingStateSubscribers.add(callback);
  // Return unsubscribe function.
  return () => loadingStateSubscribers.delete(callback);
};

const updateLoadingState = (operation, isLoading) => {
  loadingStates[operation] = isLoading;
  loadingStateSubscribers.forEach(callback => callback({ ...loadingStates }));
};

export const getLoadingStates = () => ({ ...loadingStates });

// Cache management functions
const getCacheKey = (url, params = {}) => {
  const paramString = Object.keys(params).length > 0 
    ? `?${new URLSearchParams(params).toString()}` 
    : '';
  return `${url}${paramString}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Clear cache function (useful for testing or manual cache clearing)
export const clearCache = () => {
  cache.clear();
};

// Generic fetch function with error handling
const fetchWithErrorHandling = async (url, operation) => {
  updateLoadingState(operation, true);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new PokemonAPIError(`Resource not found!`, 404, url);
      } else if (response.status >= 500) {
        throw new PokemonAPIError(`Server error: ${response.statusText}`, response.status, url);
      } else if (response.status === 429) {
        throw new PokemonAPIError(`Too many requests. Please try again later.`, 429, url);
      } else {
        throw new PokemonAPIError(`HTTP Error: ${response.status} ${response.statusText}`, response.status, url);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new PokemonAPIError(`Invalid response format. Expected JSON`, response.status, url);
    }

    const data = await response.json();
    
    // Validate that we received valid data
    if (!data || typeof data !== 'object') {
      throw new PokemonAPIError(`Invalid response data`, response.status, url);
    }

    return data;
  } catch (error) {
    if (error instanceof PokemonAPIError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError(`Network error: Please check your internet connection`, url);
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new PokemonAPIError(`Invalid JSON response`, null, url);
    }
    
    // Re-throw unknown errors
    throw new PokemonAPIError(`Unexpected error: ${error.message}`, null, url);
  } finally {
    updateLoadingState(operation, false);
  }
};

/**
 * Search for a Pokemon by name or ID
 * @param {string|number} query - Pokemon name or ID
 * @returns {Promise<Object>} Pokemon data
 * @throws {PokemonAPIError|NetworkError} When request fails
 */
export const searchPokemon = async (query) => {
  if (!query) {
    throw new PokemonAPIError('Query parameter is required!', null, null);
  }

  // Normalize query (lowercase for names, ensure it's a string)
  const normalizedQuery = String(query).toLowerCase().trim();
  
  if (!normalizedQuery) {
    throw new PokemonAPIError('Query parameter cannot be empty', null, null);
  }

  // Validate query format (alphanumeric only)
  if (!/^[a-zA-Z0-9\-]+$/.test(normalizedQuery)) {
    throw new PokemonAPIError('Query must contain only alphanumeric characters and hyphens', null, null);
  }

  const url = `https://pokeapi.co/api/v2/pokemon/${normalizedQuery}`;
  const cacheKey = getCacheKey(url);
  
  // Check cache first.
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const data = await fetchWithErrorHandling(url, 'searchPokemon');
    
    // Validate Pokemon data structure.
    if (!data.id || !data.name || !data.sprites) {
      throw new PokemonAPIError('Invalid Pokemon data structure received', null, url);
    }

    // Cache the successful response.
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    if (error.status === 404) {
      throw new PokemonAPIError(`Pokemon "${query}" not found`, 404, url);
    }
    throw error;
  }
};

/**
 * Get a list of Pokemon (first 151 by default)
 * @param {number} limit - Number of Pokemon to fetch (default: 151)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Pokemon list data
 * @throws {PokemonAPIError|NetworkError} When request fails
 */
export const getPokemonList = async (limit = 151, offset = 0) => {
  // Validate parameters
  if (limit < 1 || limit > 1000) {
    throw new PokemonAPIError('Limit must be between 1 and 1000', null, null);
  }
  
  if (offset < 0) {
    throw new PokemonAPIError('Offset must be 0 or greater', null, null);
  }

  const url = `https://pokeapi.co/api/v2/pokemon`;
  const params = { limit, offset };
  const cacheKey = getCacheKey(url, params);
  
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const fullUrl = `${url}?limit=${limit}&offset=${offset}`;
  
  try {
    const data = await fetchWithErrorHandling(fullUrl, 'getPokemonList');
    
    // Validate Pokemon list data structure
    if (!data.results || !Array.isArray(data.results)) {
      throw new PokemonAPIError('Invalid Pokemon list data structure received', null, fullUrl);
    }

    // Validate each Pokemon entry has required fields
    const invalidEntries = data.results.filter(pokemon => !pokemon.name || !pokemon.url);
    if (invalidEntries.length > 0) {
      throw new PokemonAPIError('Some Pokemon entries have invalid data structure', null, fullUrl);
    }

    // Cache the successful response
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Pokemon species information by ID
 * @param {string|number} id - Pokemon species ID
 * @returns {Promise<Object>} Pokemon species data
 * @throws {PokemonAPIError|NetworkError} When request fails
 */
export const getPokemonSpecies = async (id) => {
  if (!id) {
    throw new PokemonAPIError('ID parameter is required', null, null);
  }

  // Validate ID format
  const normalizedId = String(id).trim();
  if (!normalizedId) {
    throw new PokemonAPIError('ID parameter cannot be empty', null, null);
  }

  // Ensure ID is numeric or a valid name
  if (!/^[a-zA-Z0-9\-]+$/.test(normalizedId)) {
    throw new PokemonAPIError('ID must contain only alphanumeric characters and hyphens', null, null);
  }

  const url = `https://pokeapi.co/api/v2/pokemon-species/${normalizedId}`;
  const cacheKey = getCacheKey(url);
  
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const data = await fetchWithErrorHandling(url, 'getPokemonSpecies');
    
    // Validate Pokemon species data structure
    if (!data.id || !data.name) {
      throw new PokemonAPIError('Invalid Pokemon species data structure received', null, url);
    }

    // Cache the successful response
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    if (error.status === 404) {
      throw new PokemonAPIError(`Pokemon species with ID "${id}" not found`, 404, url);
    }
    throw error;
  }
};

/**
 * Get detailed Pokemon data with species information combined
 * This is a helper function that combines searchPokemon and getPokemonSpecies
 * @param {string|number} query - Pokemon name or ID
 * @returns {Promise<Object>} Combined Pokemon and species data
 */
export const getPokemonWithSpecies = async (query) => {
  try {
    const [pokemonData, speciesData] = await Promise.all([
      searchPokemon(query),
      getPokemonSpecies(query)
    ]);

    return {
      pokemon: pokemonData,
      species: speciesData
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Batch fetch multiple Pokemon by their URLs (useful for getting full data from list results)
 * @param {Array<string>} urls - Array of Pokemon URLs
 * @param {number} batchSize - Number of concurrent requests (default: 5)
 * @returns {Promise<Array<Object>>} Array of Pokemon data
 */
export const batchFetchPokemon = async (urls, batchSize = 5) => {
  if (!Array.isArray(urls)) {
    throw new PokemonAPIError('URLs parameter must be an array', null, null);
  }

  if (urls.length === 0) {
    return [];
  }

  const results = [];
  
  // Process URLs in batches to avoid overwhelming the API
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (url) => {
      try {
        const cacheKey = getCacheKey(url);
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          return cachedData;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new PokemonAPIError(`Failed to fetch Pokemon from ${url}`, response.status, url);
        }

        const data = await response.json();
        setCachedData(cacheKey, data);
        return data;
      } catch (error) {
        console.error(`Failed to fetch Pokemon from ${url}:`, error);
        return null; // Return null for failed requests, filter out later
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(result => result !== null));
  }

  return results;
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  cache.forEach((value) => {
    if (now - value.timestamp < CACHE_DURATION) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
    cacheDuration: CACHE_DURATION
  };
};

// Export default object with all functions for convenience
export default {
  searchPokemon,
  getPokemonList,
  getPokemonSpecies,
  getPokemonWithSpecies,
  batchFetchPokemon,
  subscribeToLoadingState,
  getLoadingStates,
  clearCache,
  getCacheStats,
  PokemonAPIError,
  NetworkError
};