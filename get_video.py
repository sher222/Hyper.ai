from openai import OpenAI
import requests
import time

def get_video(video_prompt):
    key = "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"

    client = OpenAI(api_key=key)

    response = client.images.generate(
        model="dall-e-3",
        prompt="a white siamese cat",
        size="1024x1024",
        quality="standard",
        n=1,
    )

    image_url = response.data[0].url
    print("got image", image_url)
    ## send job to runway

    url = "https://runwayml.p.rapidapi.com/generate/image"

    payload = {
        "img_prompt": image_url,
        "motion": 5,
        "seed": 0,
        "upscale": True,
        "interpolate": True
    }
    headers = {
        "content-type": "application/json",
        "X-RapidAPI-Key": "de0f78a0a1mshf533983f3641713p12b44ajsn65b456e29d76",
        "X-RapidAPI-Host": "runwayml.p.rapidapi.com"
    }

    response = requests.post(url, json=payload, headers=headers).json()
    uuid = response["uuid"]
    ## check on job status

    url = "https://runwayml.p.rapidapi.com/status"

    querystring = {"uuid": uuid}

    headers = {
        "X-RapidAPI-Key": "de0f78a0a1mshf533983f3641713p12b44ajsn65b456e29d76",
        "X-RapidAPI-Host": "runwayml.p.rapidapi.com"
    }
    while True:
        response = requests.get(url, headers=headers, params=querystring).json()
        if response["status"] == "success":
            return response["url"]
        time.sleep(1)
            
print(get_video("a pretty, happy teenage (13 - 16 year old) girl in Paris holding a baguette"))