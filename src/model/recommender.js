const audio_features = [
  "danceability",
  "energy",
  "key",
  "loudness",
  "speechiness",
  "liveness",
  "tempo",
  "duration_ms",
  "year"
]

const feature_weights = {
  danceability: 1.0,
  energy: 3.0,
  key: 0.3,
  loudness: 1.0,
  speechiness: 0.5,
  liveness: 1.5,
  tempo: 0.5,
  duration_ms: 0.3,
  year: 0.5
}

const alpha = 0.80
const niche_weight = 0.05
const genre_weight = 0.15
const best_k = 29


// COSINE SIMILARITY
function cosineSimilarity(a, b){

  let dot = 0
  let normA = 0
  let normB = 0

  for(let i=0;i<a.length;i++){
    dot += a[i]*b[i]
    normA += a[i]*a[i]
    normB += b[i]*b[i]
  }

  return dot/(Math.sqrt(normA)*Math.sqrt(normB))
}

// BUILD WEIGHTED VECTOR
function buildVector(track){

  return audio_features.map(f=>{
    const v = track[f] ?? 0
    return v * feature_weights[f]
  })
}

export function recommendSongs(userTrackIds, trackPool){

  const userTracks = trackPool.filter(t =>
    userTrackIds.includes(t.id)
  )

  if(userTracks.length===0) return []

  // STORE BEST SIMILARITY PER SONG
  const candidateMap = new Map()

  // QUERY KNN PER INPUT SONG
  userTracks.forEach(track=>{

    const trackVector = buildVector(track)

    const similarities = trackPool.map(song=>{

      const vec = buildVector(song)

      const sim = cosineSimilarity(trackVector, vec)

      return {
        ...song,
        cosine_sim: sim
      }
    })

    const neighbors = similarities
      .filter(t=>!userTrackIds.includes(t.id))
      .sort((a,b)=>b.cosine_sim-a.cosine_sim)
      .slice(0,best_k)

    neighbors.forEach(song=>{

      if(!candidateMap.has(song.id) || candidateMap.get(song.id).cosine_sim < song.cosine_sim){
        candidateMap.set(song.id, song)
      }
    })
  })

  const candidates = Array.from(candidateMap.values())


  // USER GENRES
  const userGenres = new Set(
    userTracks.map(t => t.genre ?? t.track_genre).filter(Boolean)
  )

  // FINAL SCORING
  const ranked = candidates.map(track=>{

    const niche_score =
      1 - ((track.avg_artist_popularity ?? 50) / 100)

    const trackGenre = track.genre ?? track.track_genre

    const genre_match =
      trackGenre && userGenres.has(trackGenre)
        ? 1
        : 0

    const final_score =
      alpha * track.cosine_sim +
      niche_weight * niche_score +
      genre_weight * genre_match

    return {
      ...track,
      final_score
    }
  })

  const sorted = ranked.sort((a,b)=>b.final_score-a.final_score)
  return sorted.slice(0,10)
}