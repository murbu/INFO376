import pandas as pd

df = pd.read_csv("src/data/combined_data.csv")

df.to_json("src/data/songs.json", orient="records")