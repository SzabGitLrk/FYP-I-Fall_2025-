import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wavfile

SAMPLE_RATE = 44100  # 44.1kHz

def record_audio(duration=None, threshold=0.01, chunk=1024):
    """
    Record audio:
    - duration=None -> record until silence (based on threshold)
    - duration=int -> record fixed seconds
    """
    print(f"🎙️ Recording {'until silence...' if duration is None else f'for {duration} seconds...'}")
    recorded_chunks = []

    if duration is not None:
        # Fixed duration recording
        audio = sd.rec(int(duration*SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1)
        sd.wait()
        return audio.flatten()
    else:
        # Silence-based recording
        while True:
            data = sd.rec(chunk, samplerate=SAMPLE_RATE, channels=1)
            sd.wait()
            recorded_chunks.append(data)
            if np.max(np.abs(data)) < threshold:
                break
        audio = np.concatenate(recorded_chunks, axis=0)
        return audio.flatten()


def bandpass_filter(audio, low=300, high=3400):
    from scipy.signal import butter, filtfilt
    b, a = butter(4, [low/(SAMPLE_RATE/2), high/(SAMPLE_RATE/2)], btype='band')
    return filtfilt(b, a, audio)


def reduce_noise(audio):
    # Simple normalization as placeholder
    return audio / (np.max(np.abs(audio)) + 1e-6)


def normalize_audio(audio):
    return audio / np.max(np.abs(audio))


def save_audio(audio, filename="user_input.wav"):
    wavfile.write(filename, SAMPLE_RATE, (audio * 32767).astype(np.int16))
