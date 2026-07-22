# from gtts import gTTS
import edge_tts
import asyncio
import os
import uuid
from deep_translator import GoogleTranslator

# Voice Configuration
VOICE_EN = "en-US-AriaNeural" # or en-US-ChristopherNeural
VOICE_UR = "ur-PK-UzmaNeural" # Excellent Urdu Neural voice

async def _generate_edge_tts(text, voice, output_path):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def generate_voice(text, lang='en'):
    """
    Generates audio for the given text using Microsoft Edge Neural TTS.
    If lang is 'ur', translates text to Urdu first.
    Returns the path to the generated mp3 file.
    """
    
    # Pre-process text for better TTS
    text = text.replace("HbA1c", "H.B.A.1.C")
    text = text.replace("hb1c", "H.B.A.1.C")
    
    # Translate if Urdu
    if lang == 'ur':
        try:
            # Custom replacements for Urdu translation to handle medical terms
            urdu_text = text
            # Replace common terms with phonetic Urdu if needed before translation
            # Or handle after translation if translator messes up
            
            translator = GoogleTranslator(source='auto', target='ur')
            translation = translator.translate(urdu_text)
            
            # Post-translation fixes for Urdu
            translation = translation.replace("ایچ بی اے 1 سی", "ایچ بی اے ون سی")
            
            text_to_speak = translation
            voice = VOICE_UR
        except Exception as e:
            print(f"Translation failed: {e}")
            text_to_speak = text 
            voice = VOICE_EN # Fallback to English voice if translation fails
    else:
        text_to_speak = text
        voice = VOICE_EN

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(base_dir, "static")
    
    # Generate Audio via Edge TTS
    filename = f"speech_{uuid.uuid4().hex}.mp3"
    save_path = os.path.join(static_dir, filename) 
    
    # Ensure static dir exists
    os.makedirs(static_dir, exist_ok=True)
    
    # Run async function in sync wrapper
    try:
        asyncio.run(_generate_edge_tts(text_to_speak, voice, save_path))
    except Exception as e:
        print(f"EdgeTTS Error: {e}")
        # Fallback to gTTS if Edge fails? 
        # For now, let's assume it works or fail.
        raise e

    return save_path
