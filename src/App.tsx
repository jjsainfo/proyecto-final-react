import { useState, useEffect } from 'react'
import { searchPokemon, subscribeToLoadingState, getLoadingStates } from './api/services/pokemonApi.js'
import { PokemonAPIError, NetworkError } from './api/services/pokemonApi.js'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
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
  const [loadingStates, setLoadingStates] = useState<LoadingStates>(getLoadingStates());

  useEffect(() => {
    // Subscribe to loading state changes
    const unsubscribe = subscribeToLoadingState((states: LoadingStates) => {
      setLoadingStates(states);
    });

    // Call searchPokemon with 'pikachu' on component mount
    const fetchPikachu = async () => {
      try {
        setError(''); // Clear any previous errors
        const pikachuData = await searchPokemon('pikachu');
        setPokemon(pikachuData);
        console.log('Pikachu data:', pikachuData);
      } catch (err) {
        console.error('Error fetching Pikachu:', err);
        
        if (err instanceof PokemonAPIError) {
          setError(`Pokemon API Error: ${err.message}`);
        } else if (err instanceof NetworkError) {
          setError(`Network Error: ${err.message}`);
        } else {
          setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        }
      }
    };

    fetchPikachu();

    // Cleanup subscription on component unmount
    return unsubscribe;
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      
      <h1>Pokemon App with Vite + React</h1>
      
      {/* Loading indicator */}
      {loadingStates.searchPokemon && (
        <div className="loading">
          <p>🔍 Searching for Pokemon...</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error" style={{ color: 'red', margin: '1rem 0' }}>
          <p>❌ {error}</p>
        </div>
      )}

      {/* Pokemon display */}
      {pokemon && !loadingStates.searchPokemon && (
        <div className="pokemon-card" style={{ 
          border: '2px solid #ccc', 
          borderRadius: '10px', 
          padding: '1rem', 
          margin: '1rem 0',
          textAlign: 'center',
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h2 style={{ textTransform: 'capitalize' }}>
            {pokemon.name} #{pokemon.id}
          </h2>
          
          {pokemon.sprites.front_default && (
            <img 
              src={pokemon.sprites.front_default} 
              alt={pokemon.name}
              style={{ width: '150px', height: '150px' }}
            />
          )}
          
          <div className="pokemon-info">
            <p><strong>Height:</strong> {pokemon.height / 10} m</p>
            <p><strong>Weight:</strong> {pokemon.weight / 10} kg</p>
            <p><strong>Base Experience:</strong> {pokemon.base_experience}</p>
            
            <div className="types">
              <strong>Types: </strong>
              {pokemon.types.map((typeInfo, index) => (
                <span 
                  key={index}
                  style={{ 
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '15px',
                    margin: '0 0.25rem',
                    textTransform: 'capitalize'
                  }}
                >
                  {typeInfo.type.name}
                </span>
              ))}
            </div>
            
            <div className="abilities" style={{ marginTop: '1rem' }}>
              <strong>Abilities: </strong>
              {pokemon.abilities.map((abilityInfo, index) => (
                <span key={index} style={{ textTransform: 'capitalize' }}>
                  {abilityInfo.ability.name}
                  {index < pokemon.abilities.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading states debug info */}
      <div className="debug-info" style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f5f5f5',
        borderRadius: '5px',
        fontSize: '0.9rem'
      }}>
        <h3>Debug: Loading States</h3>
        <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
          <li>🔍 Search Pokemon: {loadingStates.searchPokemon ? '⏳ Loading...' : '✅ Ready'}</li>
          <li>📋 Pokemon List: {loadingStates.getPokemonList ? '⏳ Loading...' : '✅ Ready'}</li>
          <li>🧬 Pokemon Species: {loadingStates.getPokemonSpecies ? '⏳ Loading...' : '✅ Ready'}</li>
        </ul>
      </div>

      <p className="read-the-docs">
        Pokemon data fetched using our custom Pokemon API service!
      </p>
    </>
  )
}

export default App
