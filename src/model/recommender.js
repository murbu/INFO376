// define metrics and weights for the recommendation algorithm
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

// precomputed means and scales for standardization, based on training data
const scaler_mean = [
  0.527332496,
  0.670965291,
  5.27641386,
  -7.88251655,
  0.0854913359,
  0.224048807,
  122.818024,
  237284.549,
  2007.11414
]

const scaler_scale = [
  0.172371906,
  0.245456918,
  3.55274681,
  3.85684191,
  0.0932953002,
  0.197055543,
  29.4469738,
  96543.4258,
  13.6186277
]

// number of recommendations to return (best_k computed from validation data)
const best_k = 29

// compute cosine similarity between two vectors
function cosineSimilarity(a, b){
  // compute dot product to see how closely aligned the vectors are
  let dot = 0
  let normA = 0
  let normB = 0

  for(let i=0;i<a.length;i++){
    dot += a[i]*b[i]
    normA += a[i]*a[i]
    normB += b[i]*b[i]
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
}

// gets value from each track and build vector of standardized and weighted features
function buildVector(track){

  return audio_features.map((f, i)=>{

    const raw = track[f] ?? 0

    const standardized =
      (raw - scaler_mean[i]) / scaler_scale[i]

    return standardized * feature_weights[f]

  })
}

// compute the average vector of a set of vectors
function averageVector(vectors){

  const length = vectors[0].length
  const avg = new Array(length).fill(0)

  vectors.forEach(v=>{
    for(let i=0;i<length;i++){
      avg[i]+=v[i]
    }
  })

  return avg.map(v=>v/vectors.length)

}


// main recommendation function
// takes in user's track ids and the pool of tracks to recommend from
export function recommendSongs(userTrackIds, trackPool){

  // get only the user's tracks from the pool
  const userTracks = trackPool.filter(t =>
    userTrackIds.includes(t.id)
  )

  if (userTracks.length === 0) return []

  // collect user's genres and artists for filtering and bonus scoring
  const userGenres = new Set(userTracks.map(t => t.genre))
  const userArtists = new Set(userTracks.map(t => t.artists))

  // centroid query vector
  const userVectors = userTracks.map(buildVector)
  const queryVector = averageVector(userVectors)

  const candidates = trackPool.map(track => {

    const vec = buildVector(track)
    const similarity = cosineSimilarity(queryVector, vec)

    const rawPop = track.avg_artist_popularity ?? 30
    const pop = Math.max(rawPop, 20)


    // niche artist rule: popularity below 60
    let niche_bonus = 0
    let popularity_bonus = 0

    // artist match
    const artist_match = userArtists.has(track.artists) ? 1 : 0

    // scoring
    const similarity_score = similarity * 0.90
   
    if (similarity > 0.82) {
      if (pop < 50 && pop >= 20) {
        niche_bonus = 0.04
      } else if (pop >= 70) {
        popularity_bonus = 0.04
      }
    }
    const artist_bonus = artist_match * 0.02


    const final_score =
      similarity_score +
      niche_bonus +
      popularity_bonus +
      artist_bonus

    return {
      ...track,
      similarity_score,
      niche_bonus,
      popularity_bonus,
      artist_bonus,
      final_score
    }
  })


  // filter out songs the user already knows and those that don't match user's genres
  const filtered = candidates.filter(song =>
      !userTrackIds.includes(song.id) &&
      userGenres.has(song.genre)
    )

  const seen = new Set()

  const unique = filtered.filter(song=>{

  const key = song.name + song.artists

  if(seen.has(key)) return false
    seen.add(key)

    return true
  })

  const sorted = unique.sort((a,b)=>b.final_score-a.final_score)

  return sorted.slice(0,best_k)
}