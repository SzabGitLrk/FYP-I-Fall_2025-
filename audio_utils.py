import numpy as np
import scipy.io.wavfile as wav
from scipy.signal import butter, sosfiltfilt
import noisereduce as nr
import sounddevice as sd
import whisper
from deep_translator import GoogleTranslator
from config import FS, DURATION, LOWCUT, HIGHCUT, FILTER_ORDER, NOISE_SAMPLE_DURATION, OUTPUT_FILE

def record_audio(duration=DURATION, fs=FS):
    print(f"\n🎙️ Recording for {duration} seconds... Speak after 1 second silence.")
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='float32')
    sd.wait()
    print("✅ Recording done.\n")
    return audio.squeeze()

def bandpass_filter(signal, fs=FS, lowcut=LOWCUT, highcut=HIGHCUT, order=FILTER_ORDER):
    nyquist = fs / 2.0
    low = max(1, lowcut) / nyquist
    high = min(highcut, nyquist - 1) / nyquist
    sos = butter(order, [low, high], btype='band', output='sos')
    return sosfiltfilt(sos, signal)

def reduce_noise(signal, fs=FS):
    noise_len = int(NOISE_SAMPLE_DURATION * fs)
    noise_profile = signal[:noise_len]
    reduced = nr.reduce_noise(y=signal, sr=fs, y_noise=noise_profile, prop_decrease=1.0)
    return reduced

def normalize_audio(signal, peak=0.98):
    max_val = np.max(np.abs(signal)) + 1e-9
    return signal / max_val * peak

def save_audio(signal, path=OUTPUT_FILE, fs=FS):
    signal = np.clip(signal, -1.0, 1.0)
    wav.write(path, fs, (signal * 32767).astype(np.int16))
    print(f"💾 Saved cleaned audio to: {path}")

# =============================================================================
# NEW TRANSLATION FUNCTION
# =============================================================================

import whisper
from deep_translator import GoogleTranslator  # ya jo translator tum use karte ho
from config import OUTPUT_FILE

def translate_urdu_to_english(audio_path=OUTPUT_FILE, model_size="large", model=None):
    """
    FAST version:
    - No language detection
    - Whisper auto-detects internally (fast)
    - Always translate output to English
    """

    # Load or reuse Whisper model
    if model is None:
        print(f"\n🎯 Loading Whisper model ({model_size})...")
        model = whisper.load_model(model_size)
    else:
        print(f"\n🎯 Reusing provided Whisper model")

    print(f"🎧 Transcribing audio (auto-detect)...")

    # Whisper will auto detect language (fast)
    result = model.transcribe(
        audio_path,
        task='transcribe',
        fp16=False,
        verbose=False,
        temperature=0.0,
        best_of=1,
        beam_size=3,
        condition_on_previous_text=True
    )

    original_text = result.get("text", "").strip()
    original_text = " ".join(original_text.split())

    detected_lang = result.get("language", "unknown")

    print(f"\n📝 Original Text ({detected_lang}):")
    print(f"   {original_text}")

    # Always translate to English (even if detected wrong)
    print("\n🔄 Translating to English...")

    try:
        translator = GoogleTranslator(source='auto', target='en')
        translated = translator.translate(original_text)

        translated = translated.strip()
        translated = " ".join(translated.split())

        output_text = translated
        print(f"🌐 English Translation:")
        print(f"   {translated}")

    except Exception as e:
        print(f"⚠️ Translation error: {e}")
        output_text = original_text

    return {
        "original_text": original_text,
        "detected_language": detected_lang,
        "translated_text": output_text,
    }

    return output


import librosa

def split_audio(file_path, chunk_duration=10):
    y, sr = librosa.load(file_path, sr=None)
    chunks = []
    total_samples = len(y)
    chunk_samples = chunk_duration * sr
    for start in range(0, total_samples, chunk_samples):
        end = min(start + chunk_samples, total_samples)
        chunks.append(y[start:end])
    return chunks, sr


def transcribe_with_streaming(audio_file, model, chunk_duration=10):
    audio_chunks, sr = split_audio(audio_file, chunk_duration=chunk_duration)
    transcript = ""
    for i, chunk in enumerate(audio_chunks):
        librosa.output.write_wav("temp.wav", chunk, sr)
        text = model.transcribe("temp.wav")["text"]
        print(text, end=" ", flush=True)  # streaming output
        transcript += text + " "
    return transcript.strip()


# def record_audio(duration=10, fs=44100):
#     print(f"🎙 Recording audio for {duration} seconds...")
#     audio = sd.rec(int(duration * fs), samplerate=fs, channels=1)
#     sd.wait()
#     return np.squeeze(audio)