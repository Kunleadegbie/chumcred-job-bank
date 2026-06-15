import os
import tempfile
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def transcribe_audio_file(file_bytes: bytes, filename: str = "interview.webm") -> str:
    suffix = "." + filename.split(".")[-1] if "." in filename else ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(file_bytes)
        temp_path = temp_file.name

    try:
        with open(temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )

        return transcript.text or ""
    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass