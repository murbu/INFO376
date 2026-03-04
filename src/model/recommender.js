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

const feature_weights = {
  danceability: 1.0,
  energy: 3.0,
  key: 0.3,
  loudness: 1.0,
  speechiness: 0.5,
  liveness: 1.5,
  tempo: 0.5,
  duration_ms: 0.3,
  year: 0.5,
  avg_artist_popularity: 0.8
}

const alpha = 0.82
const niche_weight = 0.09
const artist_weight = 0.025
const genre_weight = 0.06

const best_k = 40


// COSINE SIMILARITY
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


// BUILD WEIGHTED VECTOR
function buildVector(track) {

  return audio_features.map(f => {
    const v = track[f] ?? 0
    return v * feature_weights[f]
  })

}


// AVERAGE USER PROFILE
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


// MAIN RECOMMENDER
export function recommendSongs(userTrackIds, trackPool) {

  const userTracks = trackPool.filter(t =>
    userTrackIds.includes(t.id)
  )

  if (userTracks.length === 0) return []


  // BUILD USER PROFILE
  const userVectors = userTracks.map(buildVector)
  const userProfile = averageVector(userVectors)


  // USER GENRES
  const userGenres = new Set(
    userTracks
      .map(t => t.genre)
      .filter(Boolean)
  )


  // USER ARTISTS
  const userArtists = new Set(
    userTracks
      .flatMap(t => t.artists || [])
  )


  // COMPUTE SIMILARITY
  const similarities = trackPool.map(track => {

    const vector = buildVector(track)

    const similarity = cosineSimilarity(userProfile, vector)

    return {
      ...track,
      similarity
    }

  })


  // KNN
  const neighbors = similarities
    .filter(t => !userTrackIds.includes(t.id))
    .sort((a,b) => b.similarity - a.similarity)
    .slice(0, best_k)


  // APPLY SCORING
  const ranked = neighbors.map(track => {

    const niche_score =
      1 - ((track.avg_artist_popularity ?? 50) / 100)


    const artist_match =
      (track.artists || []).some(a => userArtists.has(a))
        ? 1 : 0


    const genre_match =
      userGenres.has(track.genre) ? 1 : 0


    const final_score =
      alpha * track.similarity +
      niche_weight * niche_score +
      artist_weight * artist_match +
      genre_weight * genre_match


    return {
      ...track,
      final_score
    }

  })


  // SORT BY SCORE
  const sorted = ranked.sort((a,b) => b.final_score - a.final_score)


  // SPLIT NICHE VS MAINSTREAM
  const niche = sorted.filter(
    t => (t.avg_artist_popularity ?? 50) < 40
  )

  const mainstream = sorted.filter(
    t => (t.avg_artist_popularity ?? 50) >= 40
  )


  // GUARANTEE NICHE ARTISTS
  const guaranteedNiche = niche.slice(0,3)

  const remaining = [
    ...niche.slice(3),
    ...mainstream
  ]


  const finalList = [
    ...guaranteedNiche,
    ...remaining
  ]


  // REMOVE DUPLICATES
  const unique = []
  const seen = new Set()

  for (const song of finalList) {

    const key = song.name + (song.artists?.join("") ?? "")

    if (!seen.has(key)) {
      seen.add(key)
      unique.push(song)
    }

  }


  // RETURN TOP 10
  return unique.slice(0,10)

}