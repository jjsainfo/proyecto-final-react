import './SearchBar.css';
function SearchBar() {
    
    
    return (
        <div className="search-input-container">
            <h1> MI pokemon docker</h1>
            <div className="search-bar">

              
                   <input
                type="text"
                placeholder="Search Pokemons!"
               
                
                className="search-input"
              />
            </div>
          </div>                
      )
}

export default SearchBar