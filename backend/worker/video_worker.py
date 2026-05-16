import os
import sys
import requests

os.environ["IMAGEIO_FFMPEG_EXE"] = r"C:\ffmpeg\bin\ffmpeg.exe"

from moviepy import ImageClip, AudioFileClip, VideoFileClip, concatenate_videoclips

API_KEY = "sk_49ee82f59cecd3d892b551d7c224f170e112a5537a2b10eb"
VOICE_ID = "5rg6JzqsJQ7uST2OHAkc"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
AUDIO_DIR = os.path.join(OUTPUTS_DIR, "audios")

os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)


def get_size(format_type):
    if format_type == "youtube":
        return 1920, 1080

    if format_type == "square":
        return 1080, 1080

    return 1080, 1920


def find_txt_file():
    txt_files = [
        f for f in os.listdir(UPLOADS_DIR)
        if f.lower().endswith(".txt")
    ]

    if not txt_files:
        return None

    txt_files.sort()

    return os.path.join(UPLOADS_DIR, txt_files[0])


def read_text_lines():
    txt_path = find_txt_file()

    if not txt_path:
        return []

    with open(txt_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    return lines


def get_images():
    images = [
        f for f in os.listdir(UPLOADS_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".jfif"))
    ]

    images.sort()

    return [
        os.path.join(UPLOADS_DIR, image)
        for image in images
    ]


def create_audio(text, audio_path):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }

    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8
        }
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code != 200:
        raise Exception(f"ElevenLabs hata: {response.text}")

    with open(audio_path, "wb") as f:
        f.write(response.content)


def create_video(image_path, audio_path, output_path, format_type):
    width, height = get_size(format_type)

    audio = AudioFileClip(audio_path)

    clip = ImageClip(image_path).with_duration(audio.duration)

    if clip.w / clip.h > width / height:
        clip = clip.resized(height=height)
    else:
        clip = clip.resized(width=width)

    clip = clip.cropped(
        x_center=clip.w / 2,
        y_center=clip.h / 2,
        width=width,
        height=height
    )

    clip = clip.with_audio(audio)

    clip.write_videofile(
        output_path,
        fps=24,
        codec="libx264",
        audio_codec="aac"
    )

    clip.close()
    audio.close()


def main():
    format_type = sys.argv[1] if len(sys.argv) > 1 else "shorts"

    texts = read_text_lines()
    images = get_images()

    total = min(len(texts), len(images))

    print("Metin sayısı:", len(texts))
    print("Görsel sayısı:", len(images))
    print("Üretilecek video:", total)

    if total == 0:
        print("Metin veya görsel bulunamadı.")
        return

    video_paths = []

    for index in range(total):
        text = texts[index]
        image_path = images[index]

        audio_path = os.path.join(AUDIO_DIR, f"audio_{index + 1}.mp3")
        video_path = os.path.join(OUTPUTS_DIR, f"video_{index + 1}.mp4")

        print(f"{index + 1}. ses oluşturuluyor...")
        create_audio(text, audio_path)

        print(f"{index + 1}. video oluşturuluyor...")
        create_video(image_path, audio_path, video_path, format_type)

        video_paths.append(video_path)

    final_path = os.path.join(OUTPUTS_DIR, "final_compilation.mp4")

    print("Final video birleştiriliyor...")

    clips = [VideoFileClip(path) for path in video_paths]

    final_video = concatenate_videoclips(clips, method="compose")

    final_video.write_videofile(
        final_path,
        fps=24,
        codec="libx264",
        audio_codec="aac"
    )

    final_video.close()

    for clip in clips:
        clip.close()

    print("Final video oluşturuldu:", final_path)
    print("Tüm videolar hazır.")


if __name__ == "__main__":
    main()