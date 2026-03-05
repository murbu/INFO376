library(dplyr)
library(tidyverse)
library(readr)

df <- read.csv("songs.csv")
#glimpse(df)

# Clean data and keep only variables that we need for analyzing
songs_df <- df %>% drop_na() 
songs_df <- df %>% select('id','name','artists','danceability','energy','key',
              'loudness','speechiness','liveness','tempo','duration_ms','year','genre','avg_artist_popularity')
songs_df <- songs_df %>% distinct(name, .keep_all = TRUE)

# Shuffle the dataset randomly and split dataset into three equal parts:
# testing, training, and validation
set.seed(123)
songs_shuffled <- songs_df[sample(nrow(songs_df)), ]

n <- nrow(songs_shuffled)

testing <- songs_shuffled[1:floor(n/3), ]
training <- songs_shuffled[(floor(n/3)+1):(2*floor(n/3)), ]
validation <- songs_shuffled[(2*floor(n/3)+1):n, ]

# function that checks ratio of niche artists(pop<40) in datasets
check_low_pop_ratio <- function(df) {
  mean(df$avg_artist_popularity < 40)
}

# we want to make sure it contains at least 30%
check_low_pop_ratio(testing)
check_low_pop_ratio(training)
check_low_pop_ratio(validation)

# export datasets
write.csv(training, "training.csv", row.names = FALSE)
write.csv(testing, "testing.csv", row.names = FALSE)
write.csv(validation, "validation.csv", row.names = FALSE)
write.csv(songs_shuffled, "combined_data.csv", row.names = FALSE)
