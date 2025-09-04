import { searchPokemon, getPokemonList, subscribeToLoadingState } from './api/services/pokemonApi.js';

// Search for a Pokemon.
try {
    const pikachu = await searchPokemon('pikachu');
    console.log(pikachu.name, pikachu.id);
} catch (error) {
    console.error('Search failed:', error.message);
}

// Get Pokemon list.
const pokemonList = await getPokemonList(20, 0);

// Subscribe to loading states.
const unsubscribe = subscribeToLoadingState((loadingStates) => {
    console.log('Loading states:', loadingStates);
});
