# config.py
# =========================
# Central configuration file
# =========================

# Audio settings
FS = 44100                  # Sample rate
DURATION = 10               # Recording duration (seconds)

# Bandpass filter settings
LOWCUT = 80                 # Hz
HIGHCUT = 8000              # Hz
FILTER_ORDER = 5

# Noise reduction
NOISE_SAMPLE_DURATION = 1.0 # seconds

# Output file
OUTPUT_FILE = "cleaned_audio.wav"

# =========================
# Whisper configuration
# =========================

WHISPER_MODEL = "base"      # options: tiny, base, small, medium, large
WHISPER_TEMPERATURE = 0.0   # deterministic transcription
WHISPER_LANG = None          # or "en" for English, "ur" for Urdu, etc.