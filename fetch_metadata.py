import csv
from openai import OpenAI
import json

key = # PUT IT HERE

client = OpenAI(
    api_key=key,
)

csv_file_path = "user_preferences.csv"


def fetch_content_metadata(csv_file_path, user_goal):
    resulting_content_metadata = []
    with open("openai_prompt.txt", "r", encoding="utf-8") as txt_file:
        base_prompt = txt_file.read()

    user_preferences = []
    user_demographics = []
    with open(csv_file_path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            user_preferences.append(row["preferences"])
            user_demographics.append(row["age"] + " " + row["gender"])

    for i, user_preference in enumerate(user_preferences):
        prompt = (
            base_prompt
            + "goal: "
            + user_goal
            + "\nviewer's preferences: "
            + user_preference
            + "\nview's demographics: "
            + user_demographics[i]
        )
        messages = [{"role": "user", "content": prompt}]
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.2,
            max_tokens=1000,
            frequency_penalty=0.0,
        )
        response_string = response.choices[0].message.content
        response_dict = json.loads(response_string)
        resulting_content_metadata.append(response_dict)
    result_file = "resulting_content_metadata.json"
    with open(result_file, "w") as file:
        json.dump(resulting_content_metadata, file, indent=4)
    return result_file


user_goal = "download the app sage which is a shopping agent that helps people easily shop and find personalized items"
result = fetch_content_metadata("user_preferences.csv", user_goal)
