# ================================================================
#   ROLE-BASED CONVERSATIONAL MENTOR (WHISPER + ONLINE TTS)
# ================================================================

import sounddevice as sd
from scipy.io.wavfile import write
from whisper_transcribe import transcribe_audio
from llm_client import correct_transcript, speak_text

SAMPLE_RATE = 16000
TEMP_AUDIO_FILE = "user_input.wav"

# ----------------------------
# Record audio
# ----------------------------
def record_audio(duration=5):
    print("🎤 Recording... Speak now")
    recording = sd.rec(int(duration * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
    sd.wait()
    write(TEMP_AUDIO_FILE, SAMPLE_RATE, recording)
    print(f"✅ Audio saved to {TEMP_AUDIO_FILE}")
    return TEMP_AUDIO_FILE

# ----------------------------
# Role-based mentor response (short & precise)
# ----------------------------
def role_based_mentor(transcript):
    """
    Convert user transcript into a role-based, concise mentor response.
    """
    # Construct prompt for LLM
    prompt = f"""
You are a friendly life mentor. The user describes a real-life scenario:
"{transcript}"

Respond in **2-3 concise sentences**. Be practical, polite, and human-like.
Do not give long paragraphs.
"""
    # Call LLM
    llm_result = correct_transcript(prompt, speak=False)

    # Normalize output
    if isinstance(llm_result, dict):
        reply = llm_result.get("corrected") or llm_result.get("raw") or transcript
    else:
        reply = llm_result or transcript

    # Strip and fallback
    reply = reply.strip()
    if not reply:
        reply = "Sorry, I could not understand that."
    return reply

# ----------------------------
# Main mentor assistant loop
# ----------------------------
def run_mentor_assistant():
    print("\n🎯 ROLE-BASED MENTOR ASSISTANT (WHISPER + ONLINE TTS)")
    print("Type 'exit' or 'quit' to end the session.\n")

    while True:
        try:
            input("🎤 Press Enter to speak...")
            audio_file = record_audio(duration=5)

            # Step 1: Transcribe
            transcript = transcribe_audio(audio_file).strip()
            if not transcript:
                print("⚠️ Could not detect any speech, try again.\n")
                continue

            print(f"📝 You said: {transcript}")

            if transcript.lower() in ["exit", "quit"]:
                print("👋 Exiting mentor assistant. Goodbye!")
                break

            # Step 2: Generate role-based mentor reply
            reply = role_based_mentor(transcript)

            # Short display
            print(f"🔊 Mentor replied:\n{reply}\n")

            # Step 3: Speak reply (online TTS)
            try:
                speak_text(reply, method="online", lang="en")
            except Exception as e:
                print(f"⚠️ TTS failed: {e}")

        except KeyboardInterrupt:
            print("\n👋 Exiting mentor assistant. Goodbye!")
            break

# ================================================================
# ENTRY POINT
# ================================================================
if __name__ == "__main__":
    run_mentor_assistant()
