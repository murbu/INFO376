import React from "react"
import { useState } from "react"
import training from "./data/songs.json"
import { recommendSongs } from "./model/recommender"
import "./App.css"

export default function App(){

  const [query,setQuery] = useState("")
  const [results,setResults] = useState([])
  const [selected,setSelected] = useState([])
  const [recommendations,setRecommendations] = useState([])

  function search(text){

    setQuery(text)
  
    if(text.length < 2){
      setResults([])
      return
    }
  
    const filtered = training.filter(song =>
      song.name &&
      song.name.toLowerCase().includes(text.toLowerCase())
    )
  
    setResults(filtered.slice(0,10))
  }

  function formatArtist(artists){
    if(Array.isArray(artists)){
      return artists.join(", ")
    }
    return artists
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
      .filter(song => !ids.includes(song.id))
  
    setRecommendations(recs.slice(0,10))
  }

  return (
    <div className="container">
  
      <h1 className="title">Spotify Recommender</h1>
  
      <input
        className="search"
        placeholder="Search for a song..."
        value={query}
        onChange={e => search(e.target.value)}
      />
  
      <div className="grid">
  
        {/* SEARCH RESULTS */}
        <div className="card">
          <h2>Search Results</h2>
  
          {results.map(song => (
            <div className="songRow" key={song.id}>

              <div className="songInfo">
                <div>
                  {song.name} - {formatArtist(song.artists)}
                </div>

                <div className="genre">
                  {Array.isArray(song.genre)
                    ? song.genre.join(", ")
                    : song.genre ?? "Unknown genre"}
                </div>
              </div>

              <button onClick={() => addSong(song)}>
                Add
              </button>

            </div>
          ))}
        </div>
  
        {/* SELECTED SONGS */}
        <div className="card">
          <h2>Selected Songs</h2>
  
          {selected.map(song => (
            <div key={song.id} className="songRow">
              {song.name}
            </div>
          ))}
  
          <button className="generate" onClick={generate}>
            Generate Playlist
          </button>
        </div>
  
      </div>
  
      {/* RECOMMENDATIONS */}
      <div className="card recommendations">
        <h2>Recommended Songs</h2>
  
        {recommendations.map(song => (
          <div key={song.id} className="songRow">
            <span>
              {song.name} - {formatArtist(song.artists)}
              {song.avg_artist_popularity < 40 && " (niche)"}

              <div className="genre">
                {song.genre ?? "Unknown genre"}
              </div>
            </span>
            <span className="score">
              score {(song.final_score * 100).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
  
    </div>
  )
}