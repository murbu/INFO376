from fastapi import FastAPI
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler

app = FastAPI()

# load dataset once
train_data = pd.read_csv("data/training.csv")

audio_features = [
'danceability','energy','key','loudness','speechiness',
'liveness','tempo','duration_ms','year','avg_artist_popularity'
]

track_pool = train_data.drop_duplicates(subset='id')

scaler = MinMaxScaler()
track_matrix = scaler.fit_transform(track_pool[audio_features])

model = NearestNeighbors(n_neighbors=10, metric='cosine')
model.fit(track_matrix)

@app.post("/recommend")
def recommend(user_tracks: list[str]):

    user_df = track_pool[track_pool['id'].isin(user_tracks)]

    if user_df.empty:
        return {"error": "tracks not found"}

    user_profile = user_df[audio_features].mean().values.reshape(1,-1)

    distances, indices = model.kneighbors(user_profile)

    results = track_pool.iloc[indices[0]]

    return results[['name','artists','genre']].to_dict(orient="records")