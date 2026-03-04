// audio features used in notebook
const audio_features = [
    "danceability",
    "energy",
    "key",
    "loudness",
    "speechiness",
    "liveness",
    "tempo",
    "duration_ms",
    "year",
    "avg_artist_popularity"
  ]
  
  // feature weights from your notebook
  const feature_weights = {
    danceability: 1.0,
    energy: 3.0,
    key: 0.3,
    loudness: 1.0,
    speechiness: 0.5,
    liveness: 1.5,
    tempo: 0.5,
    duration_ms: 0.3,
    year: 0.2,
    avg_artist_popularity: 0.3
  }
  
  // scoring parameters from notebook
  const alpha = 0.855
  const niche_weight = 0.09
  const artist_weight = 0.025
  
  const best_k = 20   // use your tuned value
  
  // cosine similarity
  function cosineSimilarity(a, b) {
    let dot = 0
    let normA = 0
    let normB = 0
  
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
  
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }
  
  
  // build feature vector with weights
  function buildVector(track) {
    return audio_features.map(f => {
      const v = track[f] ?? 0
      return v * feature_weights[f]
    })
  }
  
  
  // build user profile
  function averageVector(vectors) {
  
    const length = vectors[0].length
    const avg = new Array(length).fill(0)
  
    vectors.forEach(v => {
      for (let i = 0; i < length; i++) {
        avg[i] += v[i]
      }
    })
  
    return avg.map(v => v / vectors.length)
  }
  
  
  // main recommender
  export function recommendSongs(userTrackIds, trackPool) {
  
    const userTracks = trackPool.filter(t =>
      userTrackIds.includes(t.id)
    )
  
    const userVectors = userTracks.map(buildVector)
  
    const userProfile = averageVector(userVectors)
  
    const scored = trackPool.map(track => {
  
      const vector = buildVector(track)
  
      const similarity = cosineSimilarity(userProfile, vector)
  
      // niche score (favor less popular artists)
      const niche_score = 1 - (track.avg_artist_popularity / 100)
  
      // artist match
      const artist_match = userTracks.some(u =>
        u.artists === track.artists
      ) ? 1 : 0
  
      const final_score =
        alpha * similarity +
        niche_weight * niche_score +
        artist_weight * artist_match
  
      return {
        ...track,
        final_score
      }
    })
  
  
    const recommendations = scored
      .filter(t => !userTrackIds.includes(t.id))
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, best_k)
  
    return recommendations
  }