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

const niche_weight = 0.17
const artist_weight = 0.01

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

const best_k = 29


function cosineSimilarity(a, b){

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


function buildVector(track){

  return audio_features.map((f, i)=>{

    const raw = track[f] ?? 0

    const standardized =
      (raw - scaler_mean[i]) / scaler_scale[i]

    return standardized * feature_weights[f]

  })
}


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



export function recommendSongs(userTrackIds, trackPool){

  const userTracks = trackPool.filter(t =>
    userTrackIds.includes(t.id)
  )

  if(userTracks.length===0) return []

  const userGenres = new Set(userTracks.map(t=>t.genre))
  const userArtists = new Set(userTracks.map(t=>t.artists))


  // centroid query vector
  const userVectors = userTracks.map(buildVector)
  const queryVector = averageVector(userVectors)


  // compute max popularity safely
  let maxPop = 0
  for (const t of trackPool) {
    const pop = t.avg_artist_popularity ?? 0
    if (pop > maxPop) maxPop = pop
  }

  const candidates = trackPool.map(track => {

    const vec = buildVector(track)
  
    const similarity = cosineSimilarity(queryVector, vec)
  
    const rawPop = track.avg_artist_popularity ?? 30
    const pop = Math.max(rawPop, 20)
  
    // niche score
    let niche_score = 1 - (pop / maxPop)
    niche_score = Math.min(niche_score, 0.8)
  
    // artist match
    const artist_match =
      userArtists.has(track.artists) ? 1 : 0
  
    const similarity_score = similarity * 0.80
  
    const niche_bonus =
      niche_score * 0.12
  
    const popularity_bonus =
      (pop / maxPop) * 0.07
  
    const artist_bonus =
      artist_match * 0.01
  
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


  const filtered = candidates
    .filter(song =>
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