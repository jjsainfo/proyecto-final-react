import {useCallback, useEffect, useState} from 'react'
import {
    getLoadingStates,
    NetworkError,
    PokemonAPIError,
    searchPokemon,
    subscribeToLoadingState
} from "./api/services/pokemonApi.js"
import SearchBar from './pages/SearchBar'
import './App.css'
import PokemonCard from "./components/PokemonCard.tsx";

// Interface for Pokemon data structure
interface Pokemon {
    id: number;
    name: string;
    sprites: {
        front_default: string;
        front_shiny?: string;
    };
    types: Array<{
        type: {
            name: string;
        };
    }>;
    height: number;
    weight: number;
    base_experience: number;
    abilities: Array<{
        ability: {
            name: string;
        };
    }>;
    stats: Array<{
        base_stat: number;
        stat: {
            name: string;
        };
    }>;
}

// Interface for loading states
interface LoadingStates {
    searchPokemon: boolean;
    getPokemonList: boolean;
    getPokemonSpecies: boolean;
}

function App() {
    const [pokemon, setPokemon] = useState<Pokemon | null>(null);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loadingStates, setLoadingStates] = useState<LoadingStates>(getLoadingStates());
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    useEffect(() => {
        // Subscribe to loading state changes
        const unsubscribe = subscribeToLoadingState((states: LoadingStates) => {
            setLoadingStates(states);
        });

        // Initial demo: fetch Pikachu on first load
        const fetchInitialPokemon = async () => {
            try {
                setError('');
                const pikachuData = await searchPokemon('pikachu');
                setPokemon(pikachuData);
                setSearchQuery('pikachu');
                setHasSearched(true);
                console.log('Initial Pokemon data:', pikachuData);
            } catch (err) {
                console.error('Error fetching initial Pokemon:', err);
                handlePokemonError(err);
            }
        };

        fetchInitialPokemon();

        // Cleanup subscription on component unmount
        return unsubscribe;
    }, []);

    const handlePokemonError = (err: unknown) => {
        if (err instanceof PokemonAPIError) {
            setError(`Pokemon API Error: ${err.message}`);
        } else if (err instanceof NetworkError) {
            setError(`Network Error: ${err.message}`);
        } else {
            setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        }
    };

    // Fetch Pokemon function
    const fetchPokemon = useCallback(async (query: string) => {
        try {
            setError(''); // Clear any previous errors
            setPokemon(null); // Clear previous Pokemon data
            setSearchQuery(query);
            setHasSearched(true);

            console.log(`Searching for Pokemon: "${query}"`);
            const pokemonData = await searchPokemon(query);
            setPokemon(pokemonData);
            console.log('Pokemon data received:', pokemonData);
        } catch (err) {
            console.error(`Error fetching Pokemon "${query}":`, err);
            setPokemon(null);
            handlePokemonError(err);
        }
    }, []);

    const handleSearch = useCallback((query: string) => {
        if (query && query.trim()) {
            fetchPokemon(query);
        }
    }, [fetchPokemon]);

    const handleRetry = () => {
        if (searchQuery) {
            fetchPokemon(searchQuery);
        }
    };

    const handleImageError = (pokemonName: string) => {
        console.warn(`Failed to load image for Pokemon: ${pokemonName}`);
    };
    return (
        <>
            <h1>Pokemon Search App</h1>

            {/* Search Bar */}
            <SearchBar
                onSearch={handleSearch}
                isLoading={loadingStates.searchPokemon}
                disabled={loadingStates.searchPokemon}
            />

            {/* Loading indicator */}
            {loadingStates.searchPokemon && (
                <div className="loading" style={{margin: '1rem 0'}}>
                    <p>🔍 Searching for Pokemon...</p>
                    <div className="loading-spinner" style={{
                        display: 'inline-block',
                        width: '20px',
                        height: '20px',
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 2s linear infinite'
                    }}></div>
                </div>
            )}

            {/* Error display */}
            {error && !loadingStates.searchPokemon && (
                <div className="error" style={{
                    color: 'red',
                    margin: '1rem 0',
                    padding: '1rem',
                    border: '1px solid #ff6b6b',
                    borderRadius: '8px',
                    backgroundColor: '#ffe0e0'
                }}>
                    <p>❌ {error}</p>
                    {searchQuery && (
                        <button
                            onClick={handleRetry}
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Retry Search
                        </button>
                    )}
                </div>
            )}

            {/* No results message */}
            {hasSearched && !pokemon && !error && !loadingStates.searchPokemon && (
                <div className="no-results" style={{
                    margin: '1rem 0',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    color: '#6c757d'
                }}>
                    <p>🤔 No Pokemon found matching "{searchQuery}"</p>
                </div>
            )}

            {/* Pokemon display */}
            {pokemon && !loadingStates.searchPokemon && (
                <PokemonCard
                    pokemon={pokemon}
                    showShinyToggle={true}
                    onImageError={handleImageError}
                />
            )}

            {/* Search info */}
            {searchQuery && (
                <div className="search-info" style={{
                    marginTop: '1rem',
                    fontSize: '0.9rem',
                    color: '#6c757d'
                }}>
                    Last searched: <strong style={{textTransform: 'capitalize'}}>{searchQuery}</strong>
                </div>
            )}

            {/* Loading states debug info */}
            <div className="debug-info" style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '0.85rem',
                border: '1px solid #dee2e6'
            }}>
                <h3 style={{marginTop: 0}}>Debug: API Status</h3>
                <ul style={{textAlign: 'left', listStyle: 'none', padding: 0, margin: 0}}>
                    <li>🔍 Search Pokemon: {loadingStates.searchPokemon ? '⏳ Loading...' : '✅ Ready'}</li>
                    <li>📋 Pokemon List: {loadingStates.getPokemonList ? '⏳ Loading...' : '✅ Ready'}</li>
                    <li>🧬 Pokemon Species: {loadingStates.getPokemonSpecies ? '⏳ Loading...' : '✅ Ready'}</li>
                </ul>
            </div>

            <p className="read-the-docs">
                Search for any Pokemon using the search bar above!
            </p>

            {/* Add CSS animation for loading spinner */}
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </>
    )
}

export default App
