/**
 * Comprehensive Unit Tests for Pokemon API Service
 * Tests all functions, error handling, caching, and loading states
 */

import {
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
} from '../pokemonApi.js';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Helper function to create mock responses
const createMockResponse = (data, status = 200, headers = { 'content-type': 'application/json' }) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {
    get: (key) => headers[key.toLowerCase()]
  },
  json: async () => data
});

// Mock Pokemon data
const mockPokemonData = {
  id: 25,
  name: 'pikachu',
  sprites: {
    front_default: 'https://example.com/pikachu.png',
    front_shiny: 'https://example.com/pikachu-shiny.png'
  },
  types: [{ type: { name: 'electric' } }],
  height: 4,
  weight: 60,
  base_experience: 112,
  abilities: [{ ability: { name: 'static' } }],
  stats: [{ base_stat: 35, stat: { name: 'hp' } }]
};

const mockPokemonListData = {
  count: 1281,
  next: 'https://pokeapi.co/api/v2/pokemon?offset=151&limit=151',
  previous: null,
  results: [
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
    { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' }
  ]
};

const mockSpeciesData = {
  id: 25,
  name: 'pikachu',
  flavor_text_entries: [
    { flavor_text: 'A mouse Pokemon', language: { name: 'en' } }
  ],
  genera: [
    { genus: 'Mouse Pokémon', language: { name: 'en' } }
  ],
  evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/10/' }
};

// Test setup and cleanup
beforeEach(() => {
  fetch.mockClear();
  clearCache();
  // Reset loading states
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Pokemon API Service', () => {
  
  // ========================================
  // ERROR CLASSES TESTS
  // ========================================
  
  describe('Error Classes', () => {
    test('PokemonAPIError should be created with correct properties', () => {
      const error = new PokemonAPIError('Test message', 404, 'test-endpoint');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PokemonAPIError');
      expect(error.message).toBe('Test message');
      expect(error.status).toBe(404);
      expect(error.endpoint).toBe('test-endpoint');
    });

    test('NetworkError should be created with correct properties', () => {
      const error = new NetworkError('Network failed', 'test-endpoint');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Network failed');
      expect(error.endpoint).toBe('test-endpoint');
    });
  });

  // ========================================
  // LOADING STATE MANAGEMENT TESTS
  // ========================================
  
  describe('Loading State Management', () => {
    test('getLoadingStates should return initial loading states', () => {
      const states = getLoadingStates();
      
      expect(states).toEqual({
        searchPokemon: false,
        getPokemonList: false,
        getPokemonSpecies: false
      });
    });

    test('subscribeToLoadingState should register callbacks and return unsubscribe function', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const unsubscribe1 = subscribeToLoadingState(callback1);
      const unsubscribe2 = subscribeToLoadingState(callback2);
      
      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
      
      // Test unsubscribe
      unsubscribe1();
      unsubscribe2();
    });

    test('loading state should be updated during API calls', async () => {
      const callback = jest.fn();
      subscribeToLoadingState(callback);
      
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      const promise = searchPokemon('pikachu');
      
      // Should be called with loading true initially
      expect(callback).toHaveBeenCalledWith({
        searchPokemon: true,
        getPokemonList: false,
        getPokemonSpecies: false
      });
      
      await promise;
      
      // Should be called with loading false after completion
      expect(callback).toHaveBeenLastCalledWith({
        searchPokemon: false,
        getPokemonList: false,
        getPokemonSpecies: false
      });
    });
  });

  // ========================================
  // CACHE MANAGEMENT TESTS
  // ========================================
  
  describe('Cache Management', () => {
    test('clearCache should clear all cached data', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      // Make a request to populate cache
      await searchPokemon('pikachu');
      
      // Check cache has data
      const statsBefore = getCacheStats();
      expect(statsBefore.totalEntries).toBe(1);
      
      // Clear cache
      clearCache();
      
      // Check cache is empty
      const statsAfter = getCacheStats();
      expect(statsAfter.totalEntries).toBe(0);
    });

    test('getCacheStats should return correct statistics', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      await searchPokemon('pikachu');
      
      const stats = getCacheStats();
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('validEntries');
      expect(stats).toHaveProperty('expiredEntries');
      expect(stats).toHaveProperty('cacheDuration');
      expect(stats.totalEntries).toBe(1);
      expect(stats.validEntries).toBe(1);
      expect(stats.expiredEntries).toBe(0);
    });

    test('cache should return stored data on subsequent calls', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      // First call - should hit API
      const result1 = await searchPokemon('pikachu');
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      const result2 = await searchPokemon('pikachu');
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
      
      expect(result1).toEqual(result2);
    });
  });

  // ========================================
  // SEARCH POKEMON TESTS
  // ========================================
  
  describe('searchPokemon', () => {
    test('should successfully search Pokemon by name', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      const result = await searchPokemon('pikachu');
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/pikachu');
      expect(result).toEqual(mockPokemonData);
    });

    test('should successfully search Pokemon by ID', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      const result = await searchPokemon(25);
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/25');
      expect(result).toEqual(mockPokemonData);
    });

    test('should normalize query to lowercase', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      await searchPokemon('PIKACHU');
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/pikachu');
    });

    test('should trim whitespace from query', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      await searchPokemon('  pikachu  ');
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/pikachu');
    });

    // Error handling tests
    test('should throw error when query is empty', async () => {
      await expect(searchPokemon('')).rejects.toThrow('Query parameter cannot be empty');
      await expect(searchPokemon('   ')).rejects.toThrow('Query parameter cannot be empty');
    });

    test('should throw error when query is null or undefined', async () => {
      await expect(searchPokemon(null)).rejects.toThrow('Query parameter is required');
      await expect(searchPokemon(undefined)).rejects.toThrow('Query parameter is required');
    });

    test('should throw error for invalid query format', async () => {
      await expect(searchPokemon('pikachu!')).rejects.toThrow('Query must contain only alphanumeric characters and hyphens');
      await expect(searchPokemon('pika chu')).rejects.toThrow('Query must contain only alphanumeric characters and hyphens');
    });

    test('should handle 404 error with custom message', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({}, 404));
      
      await expect(searchPokemon('nonexistent')).rejects.toThrow('Pokemon "nonexistent" not found');
    });

    test('should handle server errors', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({}, 500));
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Server error: Error');
    });

    test('should handle rate limiting', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({}, 429));
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Too many requests. Please try again later');
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Network error: Please check your internet connection');
    });

    test('should handle invalid JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ...createMockResponse({}),
        json: async () => { throw new SyntaxError('Invalid JSON'); }
      });
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Invalid JSON response');
    });

    test('should handle invalid content type', async () => {
      fetch.mockResolvedValueOnce(createMockResponse('not json', 200, { 'content-type': 'text/plain' }));
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Invalid response format. Expected JSON');
    });

    test('should validate Pokemon data structure', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({ name: 'pikachu' })); // Missing id and sprites
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Invalid Pokemon data structure received');
    });
  });

  // ========================================
  // GET POKEMON LIST TESTS
  // ========================================
  
  describe('getPokemonList', () => {
    test('should get Pokemon list with default parameters', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonListData));
      
      const result = await getPokemonList();
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon?limit=151&offset=0');
      expect(result).toEqual(mockPokemonListData);
    });

    test('should get Pokemon list with custom parameters', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonListData));
      
      const result = await getPokemonList(20, 100);
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon?limit=20&offset=100');
      expect(result).toEqual(mockPokemonListData);
    });

    // Parameter validation tests
    test('should throw error for invalid limit', async () => {
      await expect(getPokemonList(0)).rejects.toThrow('Limit must be between 1 and 1000');
      await expect(getPokemonList(1001)).rejects.toThrow('Limit must be between 1 and 1000');
    });

    test('should throw error for invalid offset', async () => {
      await expect(getPokemonList(151, -1)).rejects.toThrow('Offset must be 0 or greater');
    });

    test('should validate list data structure', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({ count: 1281 })); // Missing results
      
      await expect(getPokemonList()).rejects.toThrow('Invalid Pokemon list data structure received');
    });

    test('should validate Pokemon entries have required fields', async () => {
      const invalidData = {
        ...mockPokemonListData,
        results: [
          { name: 'bulbasaur' }, // Missing url
          { url: 'https://pokeapi.co/api/v2/pokemon/2/' } // Missing name
        ]
      };
      fetch.mockResolvedValueOnce(createMockResponse(invalidData));
      
      await expect(getPokemonList()).rejects.toThrow('Some Pokemon entries have invalid data structure');
    });
  });

  // ========================================
  // GET POKEMON SPECIES TESTS
  // ========================================
  
  describe('getPokemonSpecies', () => {
    test('should get Pokemon species by ID', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockSpeciesData));
      
      const result = await getPokemonSpecies(25);
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon-species/25');
      expect(result).toEqual(mockSpeciesData);
    });

    test('should get Pokemon species by name', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockSpeciesData));
      
      const result = await getPokemonSpecies('pikachu');
      
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon-species/pikachu');
      expect(result).toEqual(mockSpeciesData);
    });

    // Parameter validation tests
    test('should throw error when ID is empty', async () => {
      await expect(getPokemonSpecies('')).rejects.toThrow('ID parameter cannot be empty');
      await expect(getPokemonSpecies('   ')).rejects.toThrow('ID parameter cannot be empty');
    });

    test('should throw error when ID is null or undefined', async () => {
      await expect(getPokemonSpecies(null)).rejects.toThrow('ID parameter is required');
      await expect(getPokemonSpecies(undefined)).rejects.toThrow('ID parameter is required');
    });

    test('should throw error for invalid ID format', async () => {
      await expect(getPokemonSpecies('pikachu!')).rejects.toThrow('ID must contain only alphanumeric characters and hyphens');
    });

    test('should handle 404 error with custom message', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({}, 404));
      
      await expect(getPokemonSpecies('nonexistent')).rejects.toThrow('Pokemon species with ID "nonexistent" not found');
    });

    test('should validate species data structure', async () => {
      fetch.mockResolvedValueOnce(createMockResponse({ name: 'pikachu' })); // Missing id
      
      await expect(getPokemonSpecies('pikachu')).rejects.toThrow('Invalid Pokemon species data structure received');
    });
  });

  // ========================================
  // GET POKEMON WITH SPECIES TESTS
  // ========================================
  
  describe('getPokemonWithSpecies', () => {
    test('should get combined Pokemon and species data', async () => {
      fetch
        .mockResolvedValueOnce(createMockResponse(mockPokemonData))
        .mockResolvedValueOnce(createMockResponse(mockSpeciesData));
      
      const result = await getPokemonWithSpecies('pikachu');
      
      expect(result).toEqual({
        pokemon: mockPokemonData,
        species: mockSpeciesData
      });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('should handle errors from either API call', async () => {
      fetch
        .mockResolvedValueOnce(createMockResponse(mockPokemonData))
        .mockResolvedValueOnce(createMockResponse({}, 404));
      
      await expect(getPokemonWithSpecies('pikachu')).rejects.toThrow('Pokemon species with ID "pikachu" not found');
    });
  });

  // ========================================
  // BATCH FETCH POKEMON TESTS
  // ========================================
  
  describe('batchFetchPokemon', () => {
    const mockUrls = [
      'https://pokeapi.co/api/v2/pokemon/1/',
      'https://pokeapi.co/api/v2/pokemon/2/',
      'https://pokeapi.co/api/v2/pokemon/3/'
    ];

    test('should batch fetch multiple Pokemon', async () => {
      const mockData1 = { ...mockPokemonData, id: 1, name: 'bulbasaur' };
      const mockData2 = { ...mockPokemonData, id: 2, name: 'ivysaur' };
      const mockData3 = { ...mockPokemonData, id: 3, name: 'venusaur' };
      
      fetch
        .mockResolvedValueOnce(createMockResponse(mockData1))
        .mockResolvedValueOnce(createMockResponse(mockData2))
        .mockResolvedValueOnce(createMockResponse(mockData3));
      
      const result = await batchFetchPokemon(mockUrls);
      
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('bulbasaur');
      expect(result[1].name).toBe('ivysaur');
      expect(result[2].name).toBe('venusaur');
    });

    test('should handle empty array', async () => {
      const result = await batchFetchPokemon([]);
      expect(result).toEqual([]);
    });

    test('should throw error for non-array input', async () => {
      await expect(batchFetchPokemon('not-array')).rejects.toThrow('URLs parameter must be an array');
    });

    test('should filter out failed requests', async () => {
      const mockData1 = { ...mockPokemonData, id: 1, name: 'bulbasaur' };
      
      fetch
        .mockResolvedValueOnce(createMockResponse(mockData1))
        .mockResolvedValueOnce(createMockResponse({}, 404))
        .mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      const result = await batchFetchPokemon(mockUrls);
      
      expect(result).toHaveLength(2); // Should exclude the failed request
      expect(console.error).toHaveBeenCalled(); // Should log error
    });

    test('should use cache for repeated URLs', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
      
      // First batch with one URL
      await batchFetchPokemon([mockUrls[0]]);
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Second batch with same URL should use cache
      const result = await batchFetchPokemon([mockUrls[0]]);
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(result[0]).toEqual(mockPokemonData);
    });

    test('should respect batch size', async () => {
      const manyUrls = new Array(10).fill(0).map((_, i) => `https://pokeapi.co/api/v2/pokemon/${i + 1}/`);
      
      // Mock responses
      for (let i = 0; i < 10; i++) {
        fetch.mockResolvedValueOnce(createMockResponse({ ...mockPokemonData, id: i + 1 }));
      }
      
      const result = await batchFetchPokemon(manyUrls, 3); // Batch size of 3
      
      expect(result).toHaveLength(10);
      expect(fetch).toHaveBeenCalledTimes(10);
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================
  
  describe('Integration Tests', () => {
    test('should handle multiple concurrent requests', async () => {
      fetch
        .mockResolvedValueOnce(createMockResponse(mockPokemonData))
        .mockResolvedValueOnce(createMockResponse(mockPokemonListData))
        .mockResolvedValueOnce(createMockResponse(mockSpeciesData));
      
      const [pokemon, list, species] = await Promise.all([
        searchPokemon('pikachu'),
        getPokemonList(10),
        getPokemonSpecies('pikachu')
      ]);
      
      expect(pokemon.name).toBe('pikachu');
      expect(list.results).toHaveLength(3);
      expect(species.name).toBe('pikachu');
    });

    test('should maintain separate loading states for different operations', async () => {
      const callback = jest.fn();
      subscribeToLoadingState(callback);
      
      // Mock slow responses
      const slowResponse1 = new Promise(resolve => 
        setTimeout(() => resolve(createMockResponse(mockPokemonData)), 100)
      );
      const slowResponse2 = new Promise(resolve => 
        setTimeout(() => resolve(createMockResponse(mockPokemonListData)), 200)
      );
      
      fetch
        .mockReturnValueOnce(slowResponse1)
        .mockReturnValueOnce(slowResponse2);
      
      const promise1 = searchPokemon('pikachu');
      const promise2 = getPokemonList();
      
      // Check that both operations are loading
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(callback).toHaveBeenCalledWith({
        searchPokemon: true,
        getPokemonList: true,
        getPokemonSpecies: false
      });
      
      await Promise.all([promise1, promise2]);
      
      // Check that both operations are complete
      expect(callback).toHaveBeenLastCalledWith({
        searchPokemon: false,
        getPokemonList: false,
        getPokemonSpecies: false
      });
    });

    test('should handle mixed success and failure scenarios', async () => {
      fetch
        .mockResolvedValueOnce(createMockResponse(mockPokemonData))
        .mockResolvedValueOnce(createMockResponse({}, 404));
      
      const results = await Promise.allSettled([
        searchPokemon('pikachu'),
        searchPokemon('nonexistent')
      ]);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[0].value.name).toBe('pikachu');
      
      expect(results[1].status).toBe('rejected');
      expect(results[1].reason.message).toContain('not found');
    });
  });

  // ========================================
  // EDGE CASES AND SPECIAL SCENARIOS
  // ========================================
  
  describe('Edge Cases', () => {
    test('should handle Pokemon with hyphens in name', async () => {
      const mockData = { ...mockPokemonData, name: 'ho-oh' };
      fetch.mockResolvedValueOnce(createMockResponse(mockData));
      
      const result = await searchPokemon('ho-oh');
      expect(result.name).toBe('ho-oh');
    });

    test('should handle very large Pokemon list requests', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(mockPokemonListData));
      
      const result = await getPokemonList(1000, 0);
      expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon?limit=1000&offset=0');
    });

    test('should handle unexpected response data types', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(null));
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Invalid response data');
    });

    test('should handle empty string response', async () => {
      fetch.mockResolvedValueOnce(createMockResponse(''));
      
      await expect(searchPokemon('pikachu')).rejects.toThrow('Invalid response data');
    });
  });

  // ========================================
  // PERFORMANCE AND MEMORY TESTS
  // ========================================
  
  describe('Performance and Memory', () => {
    test('should not leak memory with many subscribers', () => {
      const callbacks = [];
      const unsubscribeFns = [];
      
      // Create many subscribers
      for (let i = 0; i < 100; i++) {
        const callback = jest.fn();
        callbacks.push(callback);
        unsubscribeFns.push(subscribeToLoadingState(callback));
      }
      
      // Unsubscribe all
      unsubscribeFns.forEach(unsub => unsub());
      
      // Should not crash or cause issues
      expect(() => {
        // Trigger loading state change
        fetch.mockResolvedValueOnce(createMockResponse(mockPokemonData));
        return searchPokemon('pikachu');
      }).not.toThrow();
    });

    test('cache should handle many entries without issues', async () => {
      // Create many cache entries
      for (let i = 1; i <= 100; i++) {
        const mockData = { ...mockPokemonData, id: i, name: `pokemon-${i}` };
        fetch.mockResolvedValueOnce(createMockResponse(mockData));
        await searchPokemon(`pokemon-${i}`);
      }
      
      const stats = getCacheStats();
      expect(stats.totalEntries).toBe(100);
      expect(stats.validEntries).toBe(100);
    });
  });
});

// ========================================
// HELPER FUNCTIONS FOR TESTING
// ========================================

/**
 * Helper function to wait for loading state changes
 */
export const waitForLoadingState = (expectedState) => {
  return new Promise((resolve) => {
    const unsubscribe = subscribeToLoadingState((states) => {
      if (JSON.stringify(states) === JSON.stringify(expectedState)) {
        unsubscribe();
        resolve();
      }
    });
  });
};

/**
 * Helper function to simulate network delay
 */
export const simulateNetworkDelay = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Helper function to create test Pokemon data
 */
export const createTestPokemonData = (overrides = {}) => ({
  ...mockPokemonData,
  ...overrides
});

/**
 * Helper function to create test Pokemon list data
 */
export const createTestPokemonListData = (overrides = {}) => ({
  ...mockPokemonListData,
  ...overrides
});

/**
 * Helper function to create test species data
 */
export const createTestSpeciesData = (overrides = {}) => ({
  ...mockSpeciesData,
  ...overrides
});