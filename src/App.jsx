import { useState } from "react"
import training from "./data/songs.json"
import { recommendSongs } from "./model/recommender"

export default function App(){

  const [query,setQuery] = useState("")
  const [results,setResults] = useState([])
  const [selected,setSelected] = useState([])
  const [recommendations,setRecommendations] = useState([])

  function search(text){

    setQuery(text)

    const filtered = training.filter(song =>
      song.name.toLowerCase().includes(text.toLowerCase())
    )

    setResults(filtered.slice(0,10))
  }

  function addSong(song){

    if(!selected.find(s => s.id === song.id)){
      setSelected([...selected,song])
    }
  }

  function generate(){

    if(selected.length === 0){
      alert("Please select at least one song")
      return
    }

    const ids = selected.map(s => s.id)

    const recs = recommendSongs(ids, training)

    setRecommendations(recs.slice(0,10))
  }

  return (

    <div style={{padding:40, fontFamily:"Arial"}}>

      <h1>Spotify Recommender</h1>

      <input
        placeholder="Search songs"
        value={query}
        onChange={e => search(e.target.value)}
        style={{padding:"8px", width:"300px"}}
      />

      <h3>Search Results</h3>

      {results.map(song => (
        <div key={song.id}>
          {song.name} - {song.artists}
          <button onClick={()=>addSong(song)}>Add</button>
        </div>
      ))}

      <h3>Selected Songs</h3>

      {selected.map(song => (
        <div key={song.id}>{song.name}</div>
      ))}

      <button onClick={generate}>
        Generate Playlist
      </button>

      <h3>Recommended Songs</h3>

      {recommendations.map(song => (
        <div key={song.id}>
          {song.name} — score {song.final_score.toFixed(3)}
        </div>
      ))}

    </div>
  )
}