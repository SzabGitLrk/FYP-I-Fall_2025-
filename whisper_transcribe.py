# whisper_transcribe.py

import whisper
from config import WHISPER_MODEL, WHISPER_TEMPERATURE

def transcribe_audio(file_path, language=None):
    """
    Transcribe audio file using Whisper
    
    Args:
        file_path: Path to audio file
        language: Language code ('en' for English, 'ur' for Urdu, None for auto-detect)
    
    Returns:
        Transcribed text
    """
    print(f"🔍 Loading Whisper model ({WHISPER_MODEL})...")
    model = whisper.load_model(WHISPER_MODEL)
    
    print(f"🗣️ Transcribing audio (language: {language or 'auto-detect'})...")
    
    # Agar language specify ki hai to use karo, warna config se lo
    if language:
        result = model.transcribe(file_path, language=language, temperature=WHISPER_TEMPERATURE)
    else:
        from config import WHISPER_LANG
        result = model.transcribe(file_path, language=WHISPER_LANG, temperature=WHISPER_TEMPERATURE)
    
    text = result.get("text", "").strip()
    return text