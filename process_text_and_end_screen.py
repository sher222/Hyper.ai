#  "text": "just did a set of app downloads, feelin' pumped",
# given the base video and the text, add it on top of the video

from moviepy.editor import *

company_name = "Sage"
description = "Shop smarter"
base_video = "output.gif"
text = "just did a set of app downloads, feelin' pumped"


def add_text_and_end_screen(base_video, text, company_name, description):
    video_clip = VideoFileClip(base_video)
    text_clip_width = video_clip.size[0] - 200
    text_clip = TextClip(
        text,
        fontsize=50,
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
