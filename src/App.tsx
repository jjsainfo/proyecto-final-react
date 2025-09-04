import {useCallback, useEffect, useState} from 'react'
import {
    getLoadingStates,
    NetworkError,
    PokemonAPIError,
    searchPokemon,
    subscribeToLoadingState
} from './api/services/pokemonApi.js'
import SearchBar from './pages/SearchBar'
import './App.css'

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
                <div className="pokemon-card" style={{
                    border: '2px solid #007bff',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    margin: '1.5rem auto',
                    textAlign: 'center',
                    maxWidth: '500px',
                    backgroundColor: '#f8f9fa',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    <h2 style={{
                        textTransform: 'capitalize',
                        color: '#007bff',
                        marginBottom: '1rem'
                    }}>
                        {pokemon.name} #{pokemon.id}
                    </h2>

                    {pokemon.sprites.front_default && (
                        <div style={{marginBottom: '1rem'}}>
                            <img
                                src={pokemon.sprites.front_default}
                                alt={pokemon.name}
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    imageRendering: 'pixelated'
                                }}
                            />
                        </div>
                    )}

                    <div className="pokemon-info">
                        <div className="basic-info" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <div>
                                <strong>Height:</strong><br/>
                                {pokemon.height / 10} m
                            </div>
                            <div>
                                <strong>Weight:</strong><br/>
                                {pokemon.weight / 10} kg
                            </div>
                            <div>
                                <strong>Base Experience:</strong><br/>
                                {pokemon.base_experience}
                            </div>
                        </div>

                        <div className="types" style={{marginBottom: '1rem'}}>
                            <strong>Types: </strong>
                            {pokemon.types.map((typeInfo, index) => (
                                <span
                                    key={index}
                                    style={{
                                        backgroundColor: getTypeColor(typeInfo.type.name),
                                        color: 'white',
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        margin: '0 0.25rem',
                                        textTransform: 'capitalize',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                  {typeInfo.type.name}
                </span>
                            ))}
                        </div>

                        <div className="abilities">
                            <strong>Abilities: </strong>
                            <div style={{marginTop: '0.5rem'}}>
                                {pokemon.abilities.map((abilityInfo, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            textTransform: 'capitalize',
                                            backgroundColor: '#e9ecef',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '12px',
                                            margin: '0.2rem',
                                            display: 'inline-block'
                                        }}
                                    >
                    {abilityInfo.ability.name}
                  </span>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="stats" style={{marginTop: '1rem'}}>
                            <strong>Base Stats:</strong>
                            <div style={{marginTop: '0.5rem', textAlign: 'left'}}>
                                {pokemon.stats.map((statInfo, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '0.3rem'
                                    }}>
                    <span style={{
                        minWidth: '120px',
                        textTransform: 'capitalize',
                        fontSize: '0.9rem'
                    }}>
                      {statInfo.stat.name.replace('-', ' ')}:
                    </span>
                                        <span style={{
                                            minWidth: '40px',
                                            textAlign: 'right',
                                            marginRight: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>
                      {statInfo.base_stat}
                    </span>
                                        <div style={{
                                            flex: 1,
                                            height: '8px',
                                            backgroundColor: '#e9ecef',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min((statInfo.base_stat / 200) * 100, 100)}%`,
                                                backgroundColor: getStatColor(statInfo.base_stat),
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
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

// Helper function to get type-specific colors
const getTypeColor = (type: string): string => {
    const typeColors: { [key: string]: string } = {
        fire: '#F08030',
        water: '#6890F0',
        electric: '#F8D030',
        grass: '#78C850',
        ice: '#98D8D8',
        fighting: '#C03028',
        poison: '#A040A0',
        ground: '#E0C068',
        flying: '#A890F0',
        psychic: '#F85888',
        bug: '#A8B820',
        rock: '#B8A038',
        ghost: '#705898',
        dragon: '#7038F8',
        dark: '#705848',
        steel: '#B8B8D0',
        fairy: '#EE99AC',
        normal: '#A8A878'
    };
    return typeColors[type] || '#68A090';
};

// Helper function to get stat-specific colors
const getStatColor = (statValue: number): string => {
    if (statValue >= 100) return '#4CAF50'; // Green for high stats
    if (statValue >= 70) return '#FF9800'; // Orange for medium stats
    if (statValue >= 40) return '#2196F3'; // Blue for low-medium stats
    return '#F44336'; // Red for low stats
};

export default App
