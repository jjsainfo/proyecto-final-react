import React, { useState } from 'react';

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

// Props interface for PokemonCard component
interface PokemonCardProps {
  pokemon: Pokemon;
  className?: string;
  showShinyToggle?: boolean;
  onImageError?: (pokemonName: string) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ 
  pokemon, 
  className = '', 
  showShinyToggle = true,
  onImageError 
}) => {
  const [isShiny, setIsShiny] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
    if (onImageError) {
      onImageError(pokemon.name);
    }
  };

  // Toggle between normal and shiny sprite
  const toggleShiny = () => {
    if (pokemon.sprites.front_shiny) {
      setIsShiny(!isShiny);
      setImageError(false); // Reset error state when toggling
    }
  };

  // Get current sprite URL
  const getCurrentSprite = (): string => {
    if (isShiny && pokemon.sprites.front_shiny) {
      return pokemon.sprites.front_shiny;
    }
    return pokemon.sprites.front_default;
  };

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

  // Format stat names for display
  const formatStatName = (statName: string): string => {
    return statName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div 
      className={`pokemon-card ${className}`}
      style={{
        border: '2px solid #007bff',
        borderRadius: '12px',
        padding: '1.5rem',
        margin: '1.5rem auto',
        textAlign: 'center',
        maxWidth: '500px',
        backgroundColor: '#f8f9fa',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...(!imageError && {
          ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
          }
        })
      }}
    >
      {/* Pokemon Header */}
      <div className="pokemon-header">
        <h2 style={{
          textTransform: 'capitalize',
          color: '#007bff',
          marginBottom: '0.5rem',
          fontSize: '1.8rem'
        }}>
          {pokemon.name} #{pokemon.id}
        </h2>
        
        {isShiny && (
          <div style={{
            display: 'inline-block',
            backgroundColor: '#FFD700',
            color: '#333',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            ✨ Shiny
          </div>
        )}
      </div>

      {/* Pokemon Sprite */}
      <div className="pokemon-sprite" style={{ marginBottom: '1rem', position: 'relative' }}>
        {!imageError ? (
          <>
            <img
              src={getCurrentSprite()}
              alt={`${pokemon.name}${isShiny ? ' (shiny)' : ''}`}
              style={{
                width: '150px',
                height: '150px',
                imageRendering: 'pixelated',
                cursor: showShinyToggle && pokemon.sprites.front_shiny ? 'pointer' : 'default',
                transition: 'transform 0.2s ease',
                transform: isShiny ? 'scale(1.05)' : 'scale(1)'
              }}
              onError={handleImageError}
              onClick={showShinyToggle ? toggleShiny : undefined}
              title={showShinyToggle && pokemon.sprites.front_shiny ? 'Click to toggle shiny' : ''}
            />
            
            {/* Shiny Toggle Button */}
            {showShinyToggle && pokemon.sprites.front_shiny && (
              <button
                onClick={toggleShiny}
                style={{
                  position: 'absolute',
                  bottom: '-10px',
                  right: '50%',
                  transform: 'translateX(50%)',
                  backgroundColor: isShiny ? '#FFD700' : '#6c757d',
                  color: isShiny ? '#333' : 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease'
                }}
                title="Toggle Shiny"
              >
                ✨
              </button>
            )}
          </>
        ) : (
          <div style={{
            width: '150px',
            height: '150px',
            backgroundColor: '#e9ecef',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontSize: '14px',
            margin: '0 auto'
          }}>
            🖼️ Image not available
          </div>
        )}
      </div>

      {/* Pokemon Basic Info */}
      <div className="pokemon-info">
        <div className="basic-info" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '8px'
        }}>
          <div className="info-item">
            <strong style={{ color: '#495057' }}>Height:</strong><br />
            <span style={{ fontSize: '1.1rem', color: '#007bff' }}>
              {pokemon.height / 10} m
            </span>
          </div>
          <div className="info-item">
            <strong style={{ color: '#495057' }}>Weight:</strong><br />
            <span style={{ fontSize: '1.1rem', color: '#007bff' }}>
              {pokemon.weight / 10} kg
            </span>
          </div>
          <div className="info-item">
            <strong style={{ color: '#495057' }}>Base Experience:</strong><br />
            <span style={{ fontSize: '1.1rem', color: '#007bff' }}>
              {pokemon.base_experience || 'N/A'}
            </span>
          </div>
        </div>

        {/* Pokemon Types */}
        <div className="types" style={{ marginBottom: '1rem' }}>
          <strong style={{ color: '#495057', display: 'block', marginBottom: '0.5rem' }}>
            Types:
          </strong>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {pokemon.types.map((typeInfo, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: getTypeColor(typeInfo.type.name),
                  color: 'white',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  textTransform: 'capitalize',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'transform 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {typeInfo.type.name}
              </span>
            ))}
          </div>
        </div>

        {/* Pokemon Abilities */}
        <div className="abilities" style={{ marginBottom: '1rem' }}>
          <strong style={{ color: '#495057', display: 'block', marginBottom: '0.5rem' }}>
            Abilities:
          </strong>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
            {pokemon.abilities.map((abilityInfo, index) => (
              <span
                key={index}
                style={{
                  textTransform: 'capitalize',
                  backgroundColor: '#e9ecef',
                  color: '#495057',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  border: '1px solid #dee2e6',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#007bff';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                {abilityInfo.ability.name}
              </span>
            ))}
          </div>
        </div>

        {/* Pokemon Stats */}
        <div className="stats" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.7)', 
          padding: '1rem', 
          borderRadius: '8px' 
        }}>
          <strong style={{ color: '#495057', display: 'block', marginBottom: '0.75rem' }}>
            Base Stats:
          </strong>
          <div style={{ textAlign: 'left' }}>
            {pokemon.stats.map((statInfo, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.5rem',
                gap: '0.5rem'
              }}>
                <span style={{
                  minWidth: '120px',
                  fontSize: '0.9rem',
                  color: '#495057',
                  fontWeight: '500'
                }}>
                  {formatStatName(statInfo.stat.name)}:
                </span>
                <span style={{
                  minWidth: '40px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: getStatColor(statInfo.base_stat),
                  fontSize: '0.9rem'
                }}>
                  {statInfo.base_stat}
                </span>
                <div style={{
                  flex: 1,
                  height: '10px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div 
                    style={{
                      height: '100%',
                      width: `${Math.min((statInfo.base_stat / 200) * 100, 100)}%`,
                      backgroundColor: getStatColor(statInfo.base_stat),
                      borderRadius: '5px',
                      transition: 'width 0.5s ease-out',
                      position: 'relative'
                    }}
                  >
                    {/* Stat bar glow effect */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                      borderRadius: '5px'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonCard;