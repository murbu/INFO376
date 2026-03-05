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
  const [songDetails, setSongDetails] = useState(null)

  function search(text){

    setQuery(text)
  
    const keywords = text
      .toLowerCase()
      .split(" ")
      .filter(k => k.length > 0)
  
    const filtered = training.filter(song => {
  
      const name = song.name?.toLowerCase() || ""
      const artists = song.artists?.toString().toLowerCase() || ""
      const genre = (song.genre ?? song.track_genre ?? "").toLowerCase()
  
      const searchable = name + " " + artists + " " + genre
  
      return keywords.every(word => searchable.includes(word))
  
    })
  
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

  function removeSong(songId){

    const updated = selected.filter(song => song.id !== songId)
  
    setSelected(updated)
  
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

  function generate(){

    if(selected.length === 0){
      alert("Please select at least one song")
      return
    }
  
    const ids = selected.map(s => s.id)
  
    const recs = recommendSongs(ids, training)
      .filter(song => !ids.includes(song.id))
  
    const finalRecs = recs.slice(0,10)
  
    setRecommendations(finalRecs)
  
    console.log("Recommended Songs + Features:")
  
    finalRecs.forEach(song => {
  
      console.log({
        name: song.name,
        artist: song.artists,
        genre: song.genre,
        danceability: song.danceability,
        energy: song.energy,
        speechiness: song.speechiness,
        liveness: song.liveness,
        tempo: song.tempo,
        loudness: song.loudness,
        score: song.final_score
      })
  
    })
  }

  function FeatureBar({ label, value }) {

    const percentage = Math.round(value * 100)
  
    return (
      <div className="featureRow">
  
        <div className="featureLabel">
          {label}
        </div>
  
        <div className="featureBarContainer">
          <div
            className="featureBar"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
  
        <div className="featureValue">
          {percentage}
        </div>
  
      </div>
    )
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
            <div
            className="songRow"
            key={song.id}
            onClick={() => setSongDetails(song)}
            >

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

              <span>
                {song.name} — {song.artists}
              </span>

              <button
                className="delete"
                onClick={() => removeSong(song.id)}
              >
                Remove
              </button>

            </div>
          ))}
  
          <button className="generate" onClick={generate}>
            Generate Playlist
          </button>
        </div>
  
      </div>

      {/* Song Feature Panel */}
      {songDetails && (

      <div className="card featurePanel">

        <h2>Song Features</h2>

        <p><b>{songDetails.name}</b></p>
        <p>{songDetails.artists}</p>
        <p>{songDetails.genre}</p>

        <FeatureBar label="Danceability" value={songDetails.danceability}/>
        <FeatureBar label="Energy" value={songDetails.energy}/>
        <FeatureBar label="Speechiness" value={songDetails.speechiness}/>
        <FeatureBar label="Liveness" value={songDetails.liveness}/>

      </div>

      )}
  
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