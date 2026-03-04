import pandas as pd

df = pd.read_csv("data/combined_data.csv")

df.to_json("data/songs.json", orient="records")