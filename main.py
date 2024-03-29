# ---
# output-directory: "/tmp/stable-diffusion-xl"
# args: ["--prompt", "An astronaut riding a green horse"]
# runtimes: ["runc", "gvisor"]
# ---
# # Stable Diffusion XL 1.0
#
# This example is similar to the [Stable Diffusion CLI](/docs/examples/stable_diffusion_cli)
# example, but it generates images from the larger SDXL 1.0 model. Specifically, it runs the
# first set of steps with the base model, followed by the refiner model.
#
# [Try out the live demo here!](https://modal-labs--stable-diffusion-xl-app.modal.run/) The first
# generation may include a cold-start, which takes around 20 seconds. The inference speed depends on the GPU
# and step count (for reference, an A100 runs 40 steps in 8 seconds).

# ## Basic setup

import io
from pathlib import Path

from modal import Image, Mount, Stub, asgi_app, build, enter, gpu, method
from modal.functions import FunctionCall

# ## Define a container image
#
# To take advantage of Modal's blazing fast cold-start times, we'll need to download our model weights
# inside our container image with a download function. We ignore binaries, ONNX weights and 32-bit weights.
#
# Tip: avoid using global variables in this function to ensure the download step detects model changes and
# triggers a rebuild.


sdxl_image = (
    Image.debian_slim()
    .apt_install(
        "libglib2.0-0", "libsm6", "libxrender1", "libxext6", "ffmpeg", "libgl1"
    )
    .pip_install(
        "diffusers~=0.25.0",
        "invisible_watermark~=0.1",
        "transformers~=4.36.2",
        "accelerate~=0.26.1",
        "safetensors~=0.4.1",
    )
    .apt_install("imagemagick")
    .run_commands("sed -i '/@/s/^/<!-- /; /@/s/$/ -->/' /etc/ImageMagick-6/policy.xml")
    .pip_install("moviepy~=1.0.3")
    .pip_install("pytube")
    .pip_install("youtube_search")
)

stub = Stub("stable-diffusion-xl")

with sdxl_image.imports():
    import torch
    from diffusers import DiffusionPipeline, StableVideoDiffusionPipeline
    from huggingface_hub import snapshot_download
    import moviepy.editor as mp

# ## Load model and run inference
#
# The container lifecycle [`__enter__` function](https://modal.com/docs/guide/lifecycle-functions#container-lifecycle-beta)
# loads the model at startup. Then, we evaluate it in the `run_inference` function.
#
# To avoid excessive cold-starts, we set the idle timeout to 240 seconds, meaning once a GPU has loaded the model it will stay
# online for 4 minutes before spinning down. This can be adjusted for cost/experience trade-offs.


@stub.cls(gpu=gpu.A100(memory=80), container_idle_timeout=60*10, image=sdxl_image)
class Model:
    @build()
    def build(self):
        ignore = [
            "*.bin",
            "*.onnx_data",
            "*/diffusion_pytorch_model.safetensors",
        ]
        snapshot_download(
            "stabilityai/stable-diffusion-xl-base-1.0", ignore_patterns=ignore
        )
        snapshot_download(
            "stabilityai/stable-diffusion-xl-refiner-1.0",
            ignore_patterns=ignore,
        )
        snapshot_download(
            "stabilityai/stable-video-diffusion-img2vid-xt",
            ignore_patterns=ignore,
        )

    @enter()
    def enter(self):
        load_options = dict(
            torch_dtype=torch.float16,
            use_safetensors=True,
            variant="fp16",
            device_map="auto",
        )

        # Load base model
        self.base = DiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0", **load_options
        )

        # Load refiner model
        self.refiner = DiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-refiner-1.0",
            text_encoder_2=self.base.text_encoder_2,
            vae=self.base.vae,
            **load_options,
        )
        load_options = dict(
            torch_dtype=torch.float16,
            variant="fp16"
        )
        self.video_pipeline = StableVideoDiffusionPipeline.from_pretrained("stabilityai/stable-video-diffusion-img2vid-xt", **load_options)
        self.video_pipeline.enable_model_cpu_offload()

        # Compiling the model graph is JIT so this will increase inference time for the first run
        # but speed up subsequent runs. Uncomment to enable.
        # self.base.unet = torch.compile(self.base.unet, mode="reduce-overhead", fullgraph=True)
        # self.refiner.unet = torch.compile(self.refiner.unet, mode="reduce-overhead", fullgraph=True)

    @method()
    def inference(self, prompt, n_steps=24, high_noise_frac=0.8):
        negative_prompt = "disfigured, ugly, deformed"
        image = self.base(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=n_steps,
            denoising_end=high_noise_frac,
            output_type="latent",
            height=576,
            width=1024
        ).images
        image = self.refiner(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=n_steps,
            denoising_start=high_noise_frac,
            image=image,
            height=576,
            width=1024
        ).images[0]

        frames = self.video_pipeline(image).frames[0]

        frames[0].save('output.gif',
            save_all=True, append_images=frames[1:], optimize=False, duration=200, loop=0)

        clip = mp.VideoFileClip("output.gif")
        clip.write_videofile("output.mp4")

        with open('output.mp4', "rb") as fh:
            buf = io.BytesIO(fh.read())

        return buf.getvalue()


openai_img = Image.debian_slim().pip_install("openai")

with openai_img.imports():
    from fetch_metadata import fetch_content_metadata

@stub.function(
    mounts=[Mount.from_local_dir("data", remote_path="/root/data")],
    image=openai_img
)
def get_metadata(user_csv: str, goal: str):
    with open("data/csv.csv", "w") as f:
        f.write(user_csv)

    return fetch_content_metadata("data/csv.csv", goal)


# And this is our entrypoint; where the CLI is invoked. Explore CLI options
# with: `modal run stable_diffusion_xl.py --prompt 'An astronaut riding a green horse'`


@stub.local_entrypoint()
def main(prompt: str):
#     csv_content = """preferences,age,gender
# likes taylor swift,12-16,female
# likes working out,20-24,male"""
#     print(get_metadata.remote(csv_content, "download the app sage which is a shopping agent that helps people easily shop and find personalized items"))

    image_bytes = Model().inference.remote(prompt)

    dir = Path("/tmp/stable-diffusion-xl")
    if not dir.exists():
        dir.mkdir(exist_ok=True, parents=True)

    output_path = dir / "output.mp4"
    print(f"Saving it to {output_path}")
    with open(output_path, "wb") as f:
        f.write(image_bytes)


# ## A user interface
#
# Here we ship a simple web application that exposes a front-end (written in Alpine.js) for
# our backend deployment.
#
# The Model class will serve multiple users from a its own shared pool of warm GPU containers automatically.
#
# We can deploy this with `modal deploy stable_diffusion_xl.py`.


app_img = (
    Image.debian_slim()
    .apt_install(
        "libglib2.0-0", "libsm6", "libxrender1", "libxext6", "ffmpeg", "libgl1"
    )
    .apt_install("imagemagick")
    .run_commands("sed -i '/@/s/^/<!-- /; /@/s/$/ -->/' /etc/ImageMagick-6/policy.xml")
    .pip_install("moviepy~=1.0.3")
    .pip_install("pytube")
    .pip_install("youtube_search")
)
with app_img.imports():
    from moviepy.editor import *
    from pytube import YouTube
    from youtube_search import YoutubeSearch

@stub.function(
    allow_concurrent_inputs=20,
    image=app_img,
)
@asgi_app()
def app():
    import fastapi
    from fastapi import FastAPI
    from fastapi.responses import Response
    from fastapi.middleware.cors import CORSMiddleware
    import json
    import os

    web_app = FastAPI()
    origins = [
        "*",
    ]
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    from pydantic import BaseModel

    class MetadataRequest(BaseModel):
        user_goal: str
        user_info_csv: str

    
    @web_app.post("/metadata/")
    async def handle_metadata(info: MetadataRequest):
        metadata = get_metadata.remote(info.user_info_csv, info.user_goal)
        return Response(json.dumps(metadata), media_type="text/json")
    
    @web_app.get("/infer/{prompt}")
    async def accept_job(prompt: str):
        call = Model().inference.spawn(prompt)
        return {"call_id": call.object_id}













    #  "text": "just did a set of app downloads, feelin' pumped",
    # given the base video and the text, add it on top of the video

    company_name = "Sage"
    description = "Shop smarter"
    base_video = "output.gif"
    text = "just did a set of app downloads, feelin' pumped"

    def download_music(artist, song_title, out_path):
        search_term = f"{artist} {song_title} shorts"
        
        results = YoutubeSearch(search_term, max_results=50).to_json()
        videos  = json.loads(results)["videos"]
        for v in videos:
            if "0:20" < v["duration"] and v["duration"] < "0:40":
                video_id = v["id"]
                try:
                    link = f"https://www.youtube.com/watch?v={video_id}"
                    youtubeObject = YouTube(link)
                    youtubeObject = youtubeObject.streams.filter(only_audio=True).filter(file_extension="mp4").first()
                    youtubeObject.download(filename=out_path)
                    print("downloaded", link)
                    break
                except:
                    continue
        else:
            print("could not find")
            raise RuntimeError()


    def add_text_and_end_screen(base_video, text, company_name, description):
        video_clip = VideoFileClip(base_video)
        text_clip_width = video_clip.size[0] - 200
        text_clip = TextClip(
            text,
            fontsize=70,
            font="Arial-Bold",
            color="white",
            method="caption",
            stroke_width=2,
            stroke_color="black",
            kerning=-2,
            size=(text_clip_width, None),
        )
        text_clip = text_clip.set_duration(video_clip.duration)
        final_clip = CompositeVideoClip(
            [video_clip, text_clip.set_pos(("center", 0.55), relative=True)]
        )

        # Append another video clip to the end of this one
        video_size = video_clip.size
        background_clip = ColorClip(size=video_size, color=(255, 255, 255), duration=2)
        company_name_clip = TextClip(
            company_name, font="Arial-Bold", fontsize=60, color="black", size=video_size
        ).set_duration(2)
        description_clip = TextClip(
            description,
            font="Arial",
            fontsize=30,
            color="black",
            size=video_size,
            method="caption",
        ).set_duration(2)
        end_clip = CompositeVideoClip(
            [
                background_clip,
                company_name_clip.set_pos("center"),
                description_clip.set_pos("center"),
            ]
        )

        # Manually adjust the positions
        company_name_height = company_name_clip.size[1]
        description_height = description_clip.size[1]
        video_height = background_clip.size[1]
        company_name_y = (video_height - company_name_height - description_height) / 2 + 240
        description_y = company_name_y + 60
        end_clip = CompositeVideoClip(
            [
                background_clip,
                company_name_clip.set_position(("center", company_name_y)),
                description_clip.set_position(("center", description_y)),
            ]
        )

        final_clip = concatenate_videoclips([final_clip, end_clip])
        final_clip.write_videofile("final.mp4")


    class VideoRequest(BaseModel):
        caption: str
        company_name: str
        company_description: str
        artist: str
        song_title: str

    @web_app.post("/result/{call_id}")
    async def poll_results(call_id, info: VideoRequest):
        function_call = FunctionCall.from_id(call_id)
        try:

            image_bytes = function_call.get(timeout=0)
            with open("output.mp4", "wb") as f:
                f.write(image_bytes)

            add_text_and_end_screen("output.mp4", info.caption, info.company_name, info.company_description)

            # if not(info.artist == "" or info.song_title == ""):
            #     fail = False
            #     try:
            #         print(info.artist, info.song_title)
            #         download_music(info.artist, info.song_title, "song")
            #     except Exception as e:
            #         fail = True
            #         print(e)

            #     if not fail:
            #         videoclip = VideoFileClip("final.mp4")
            #         audioclip = AudioFileClip("song.mp4")

            #         videoclip.audio = audioclip
            #         videoclip.write_videofile("final.mp4", audio_codec="aac", audio_bitrate="192k", codec="libx264")

            with open('final.mp4', "rb") as fh:
                buf = io.BytesIO(fh.read())

            return Response(buf.getvalue(), media_type="video/mp4")
        except TimeoutError:
            http_accepted_code = 202
            return fastapi.responses.JSONResponse({}, status_code=http_accepted_code)

    return web_app