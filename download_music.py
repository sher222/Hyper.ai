from pytube import YouTube
from youtube_search import YoutubeSearch
import os
import json 


def download_music(artist, song_title, out_path):
    search_term = f"{artist} {song_title} shorts"
    max_results = 1
    
    while True:
        video_id = ""
        results = YoutubeSearch(search_term, max_results=max_results).to_json()
        v = json.loads(results)["videos"][-1]
        if "0:20" < v["duration"] and v["duration"] < "0:40":
            video_id = v["id"]
        
        max_results += 1

        link = f"https://www.youtube.com/watch?v={video_id}"
        youtubeObject = YouTube(link)
        youtubeObject = youtubeObject.streams.filter(only_audio=True).all()[0]

        try:
            youtubeObject.download(out_path)
            print("downloaded", link)
            break
        except:
            print("An error has occurred")



# download_music("August", "Taylor Swift", "")

