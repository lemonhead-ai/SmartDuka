import hashlib
import os
from pathlib import Path
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

from src.core.config import get_settings

router = APIRouter(prefix="/tts", tags=["tts"])

# Directory to store cached audio files
AUDIO_CACHE_DIR = Path("data/audio_cache")
AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)


class TTSRequest(BaseModel):
    text: str
    lang: Literal["en", "sw"] = "en"


def _get_cache_path(text: str, lang: str) -> Path:
    text_clean = text.strip().lower()
    hash_key = hashlib.md5(f"{lang}:{text_clean}".encode("utf-8")).hexdigest()
    return AUDIO_CACHE_DIR / f"{hash_key}.mp3"


@router.get("/stream")
async def stream_speech(
    text: str = Query(..., min_length=1, max_length=500),
    lang: str = Query("en", pattern="^(en|sw)$"),
    voice: str = Query("nova"),
):
    """
    Returns audio stream for given text and language ('en' or 'sw').
    Prioritizes OpenAI TTS ('tts-1' with natural human voices like 'nova') when API key is present,
    with fallback to Google Translate TTS. Disk caching ensures 0ms repeat latency.
    """
    cache_file = _get_cache_path(f"{voice}:{text}", lang)

    if cache_file.exists() and cache_file.stat().st_size > 0:
        return FileResponse(
            path=cache_file,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=864000"},
        )

    settings = get_settings()
    openai_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")

    # 1. Try OpenAI High-Quality Natural Human TTS if key is configured
    if openai_key:
        try:
            client = AsyncOpenAI(api_key=openai_key)
            response = await client.audio.speech.create(
                model="tts-1",
                voice=voice if voice in ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] else "nova",
                input=text,
            )
            audio_bytes = await response.aread()
            if audio_bytes and len(audio_bytes) > 0:
                cache_file.write_bytes(audio_bytes)
                return FileResponse(
                    path=cache_file,
                    media_type="audio/mpeg",
                    headers={"Cache-Control": "public, max-age=864000"},
                )
        except Exception:
            # If OpenAI TTS stutters or key fails, fall through to Google Translate TTS
            pass

    # 2. Fallback: Fetch from Google TTS service (supports Swahili 'sw' and English 'en')
    url = "https://translate.google.com/translate_tts"
    params = {
        "ie": "UTF-8",
        "client": "tw-ob",
        "q": text,
        "tl": "sw" if lang == "sw" else "en",
    }
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Failed to synthesize speech audio.")

            cache_file.write_bytes(response.content)

        return FileResponse(
            path=cache_file,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=864000"},
        )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {exc}")
