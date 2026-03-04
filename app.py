from fastapi import FastAPI
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler

app = FastAPI()

train_data = pd.read_csv("data/training.csv")

# Features used for similarity
features = [
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

# Remove duplicate tracks
track_pool = train_data.drop_duplicates(subset="id").reset_index(drop=True)

scaler = MinMaxScaler()
scaled_features = scaler.fit_transform(track_pool[features])

track_matrix = pd.DataFrame(
    scaled_features,
    columns=features
)

feature_weights = {
    "danceability": 1.1,
    "energy": 1.1,
    "tempo": 1.0,
    "speechiness": 0.9,
    "liveness": 0.9
}

for col, weight in feature_weights.items():
    if col in track_matrix.columns:
        track_matrix[col] *= weight


model = NearestNeighbors(
    n_neighbors=10,
    metric="cosine"
)

model.fit(track_matrix)

print("Model loaded and ready")

# Endpoints
@app.get("/")
def home():
    return {"message": "Spotify recommender API running"}

@app.get("/search")
def search_song(query: str):

    results = track_pool[
        track_pool["name"].str.contains(query, case=False, na=False)
    ]

    results = results[["id", "name", "artists"]].head(10)

    return results.to_dict(orient="records")

@app.post("/recommend")
def recommend(user_tracks: list[str]):

    # Find selected songs
    user_df = track_pool[track_pool["id"].isin(user_tracks)]

    if user_df.empty:
        return {"error": "No matching tracks found"}

    # Build user taste profile
    user_profile = user_df[features].mean().values.reshape(1, -1)

    # Apply same scaling
    user_profile = scaler.transform(user_profile)

    # Apply feature weighting
    user_profile_df = pd.DataFrame(user_profile, columns=features)

    for col, weight in feature_weights.items():
        if col in user_profile_df.columns:
            user_profile_df[col] *= weight

    user_profile = user_profile_df.values

    # Find similar songs
    distances, indices = model.kneighbors(user_profile)

    recommendations = track_pool.iloc[indices[0]]

    # Remove songs already selected
    recommendations = recommendations[
        ~recommendations["id"].isin(user_tracks)
    ]

    results = recommendations[["id", "name", "artists", "genre"]]

    return results.to_dict(orient="records")