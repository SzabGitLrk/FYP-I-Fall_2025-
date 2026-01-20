# # from audio_utils import record_audio, bandpass_filter, reduce_noise, normalize_audio, save_audio
# # from whisper_transcribe import transcribe_audio
# # from llm_client import correct_transcript
# # from config import OUTPUT_FILE

# # def run_pipeline():
# #     # Step 1: Record audio
# #     raw_audio = record_audio()

# #     # Step 2: Preprocess
# #     filtered_audio = bandpass_filter(raw_audio)
# #     denoised_audio = reduce_noise(filtered_audio)
# #     normalized_audio = normalize_audio(denoised_audio)
# #     save_audio(normalized_audio)

# #     print("\n🎧 Audio preprocessing complete.\n")

# #     # Step 3: Transcribe using Whisper
# #     raw_transcript = transcribe_audio(OUTPUT_FILE)
# #     print("✅ Raw Transcript:")
# #     print("--------------------------")
# #     print(raw_transcript)
# #     print("--------------------------\n")

# #     # Step 4: Correct transcript using LLM (grammar/spelling)
# #     corrected_text = correct_transcript(raw_transcript)
# #     print("📝 Corrected Transcript:")
# #     print("--------------------------")
# #     print(corrected_text)
# #     print("--------------------------")

# # if __name__ == "__main__":
# #     run_pipeline()




# """
# Complete Audio Processing Pipeline with TTS Support
# ====================================================
# Record → Preprocess → Transcribe → Correct → Speak

# Usage:
#     python run_pipeline.py
# """

# from audio_utils import record_audio, bandpass_filter, reduce_noise, normalize_audio, save_audio
# from whisper_transcribe import transcribe_audio
# from llm_client import correct_transcript  # Now supports TTS!
# from config import OUTPUT_FILE

# def run_pipeline(enable_voice=True, tts_method='auto'):
#     """
#     Complete pipeline with optional voice output
    
#     Args:
#         enable_voice (bool): Enable voice output of corrected text
#         tts_method (str): 'auto', 'offline', or 'online'
#     """
#     print("\n" + "="*70)
#     print("      AUDIO PROCESSING PIPELINE - STARTING")
#     print("="*70 + "\n")
    
#     # Step 1: Record audio
#     print("🎤 Step 1: Recording audio...")
#     raw_audio = record_audio()
#     print("✅ Recording complete!\n")

#     # Step 2: Preprocess
#     print("🔧 Step 2: Preprocessing audio...")
#     filtered_audio = bandpass_filter(raw_audio)
#     denoised_audio = reduce_noise(filtered_audio)
#     normalized_audio = normalize_audio(denoised_audio)
#     save_audio(normalized_audio)
#     print("✅ Audio preprocessing complete!\n")

#     # Step 3: Transcribe using Whisper
#     print("📝 Step 3: Transcribing with Whisper...")
#     raw_transcript = transcribe_audio(OUTPUT_FILE)
#     print("\n" + "="*70)
#     print("✅ Raw Transcript:")
#     print("="*70)
#     print(raw_transcript)
#     print("="*70 + "\n")

#     # Step 4: Correct transcript using LLM
#     print("🤖 Step 4: Correcting with LLM...")
#     corrected_text = correct_transcript(
#         raw_transcript, 
#         speak=enable_voice,      # NEW: Voice output
#         tts_method=tts_method    # NEW: TTS method
#     )
    
#     print("\n" + "="*70)
#     print("📝 Corrected Transcript:")
#     print("="*70)
#     print(corrected_text)
#     print("="*70 + "\n")
    
#     if enable_voice:
#         print("🔊 Voice output completed!\n")
    
#     print("="*70)
#     print("      PIPELINE COMPLETED SUCCESSFULLY!")
#     print("="*70 + "\n")
    
#     return corrected_text


# def run_pipeline_silent():
#     """Run pipeline without voice output (original behavior)"""
#     return run_pipeline(enable_voice=False)


# def run_pipeline_with_voice(method='auto'):
#     """Run pipeline with voice output"""
#     return run_pipeline(enable_voice=True, tts_method=method)


# # ============================
# # MAIN ENTRY POINT
# # ============================
# if __name__ == "__main__":
#     import sys
    
#     print("\n" + "="*70)
#     print("       AUDIO PROCESSING PIPELINE")
#     print("="*70)
#     print("\nChoose mode:")
#     print("  1. Standard (No Voice)")
#     print("  2. With Voice Output (Auto)")
#     print("  3. With Voice Output (Offline - Fast)")
#     print("  4. With Voice Output (Online - High Quality)")
#     print("-"*70)
    
#     choice = input("\nEnter choice (1-4) [default=2]: ").strip() or '2'
    
#     print("\n")
    
#     if choice == '1':
#         run_pipeline_silent()
#     elif choice == '2':
#         run_pipeline_with_voice(method='auto')
#     elif choice == '3':
#         run_pipeline_with_voice(method='offline')
#     elif choice == '4':
#         run_pipeline_with_voice(method='online')
#     else:
#         print("❌ Invalid choice! Using default (With Voice - Auto)")
#         run_pipeline_with_voice(method='auto')




"""
VoiceMentor Audio Pipeline
==========================
Modes:
1. Practice Mode (Standard Audio Pipeline)
2. IELTS Mode (RAG)
"""
from audio_utils import transcribe_with_streaming, record_audio, bandpass_filter, reduce_noise, normalize_audio, save_audio
# from audio_utils import record_audio, bandpass_filter, reduce_noise, normalize_audio, save_audio
from whisper_transcribe import transcribe_audio
from llm_client import correct_transcript, speak_text , speak_text_chunked  # speak_text imported so we control TTS
from config import OUTPUT_FILE
from run_ielts_rag import run_ielts_mode  # IELTS mode
from  audio_utils import translate_urdu_to_english
from whisper import load_model






# ============================
# Audio Processing Pipeline
# ============================
def run_pipeline(enable_voice=True, tts_method='auto'):
    """
    Complete pipeline with optional voice output
    """
    print("\n" + "="*70)
    print("      AUDIO PROCESSING PIPELINE - STARTING")
    print("="*70 + "\n")
    
    # Step 1: Record audio
    print("🎤 Step 1: Recording audio...")
    raw_audio = record_audio()
    print(" Recording complete!\n")

    # Step 2: Preprocess
    print(" Step 2: Preprocessing audio...")
    filtered_audio = bandpass_filter(raw_audio)
    denoised_audio = reduce_noise(filtered_audio)
    normalized_audio = normalize_audio(denoised_audio)
    save_audio(normalized_audio)
    print("Audio preprocessing complete!\n")

    # Step 3: Transcribe using Whisper
    print("Step 3: Transcribing with Whisper...")
    raw_transcript = transcribe_audio(OUTPUT_FILE)
    print("\n" + "="*70)
    print("Raw Transcript:")
    print("="*70)
    print(raw_transcript)
    print("="*70 + "\n")

    # NEW: Try translation (Urdu -> English). If translation present, use that for LLM.
    try:
        translation_result = translate_urdu_to_english(OUTPUT_FILE, model_size="large", force_language=None)
        translated_text = translation_result.get("translated_text")
        detected_lang = translation_result.get("detected_language")
        if translated_text and detected_lang and detected_lang in ("ur", "ur-Latn", "urdu"):
            # We detected Urdu and successfully translated
            print("\n🌐 Auto-detected Urdu — using translated English for LLM correction:")
            print("="*70)
            print(translated_text)
            print("="*70 + "\n")
            llm_input = translated_text
        else:
            # No Urdu translation available — pass raw transcript as-is
            llm_input = raw_transcript
    except Exception as e:
        print(f"⚠️ Translation step failed or not available: {e}")
        llm_input = raw_transcript

    # Step 4: Correct transcript using LLM
    print("🤖 Step 4: Correcting with LLM...")

    # Call LLM but disable internal speaking — we'll speak only the corrected text below
    llm_result = correct_transcript(
        llm_input,
        speak=False,            # ensure llm_client does NOT play audio
        tts_method=tts_method
    )

    # Normalize llm_result into a single corrected_text string
    if isinstance(llm_result, dict):
        # Prefer explicit 'corrected' key, fallback to 'raw' or etc.
        corrected_text = llm_result.get("corrected") or llm_result.get("raw") or llm_input
    else:
        # If llm_result is a plain string
        corrected_text = llm_result or llm_input

    print("\n" + "="*70)
    print("📝 Corrected Transcript:")
    print("="*70)
    print(corrected_text)
    print("="*70 + "\n")

    # Speak ONLY the corrected version (if enabled)
    if enable_voice and corrected_text:
        try:
            speak_text_chunked(corrected_text, method=tts_method, lang='en')
            print("Voice output completed!\n")
        except Exception as e:
            print(f" TTS play error: {e}")
    else:
        if not enable_voice:
            print(" Voice output disabled")
        else:
            print(" No corrected text to speak")

    print("="*70)
    print("      PIPELINE COMPLETED SUCCESSFULLY!")
    print("="*70 + "\n")

    return corrected_text


def run_pipeline_silent():
    """Run pipeline without voice output"""
    return run_pipeline(enable_voice=False)


def run_pipeline_with_voice(method='auto'):
    """Run pipeline with voice output"""
    return run_pipeline(enable_voice=True, tts_method=method)


# ============================
# MAIN MODE SELECTION11
# ============================
def main():
    print("\n" + "="*70)
    print("       EngliTut MAIN MENU")
    print("="*70)
    print("\nChoose Mode:")
    print("1. Practice Mode")
    print("2. IELTS Mode (RAG)")
    choice = input("Enter choice (1-2): ").strip()

    if choice == '1':
        print("\n🎯 Running Practice Mode...\n")
        # Ask for TTS option
        print("Choose Voice Output Option:")
        print("  1. Silent (No Voice)")
        print("  2. Auto Voice Output")
        print("  3. Offline Voice Output (Fast)")
        print("  4. Online Voice Output (High Quality)")
        tts_choice = input("Enter choice (1-4) [default=2]: ").strip() or '2'

    
       

        tts_method = 'auto'
        if tts_choice == '1':
            run_pipeline_silent()
        elif tts_choice == '2':
            run_pipeline_with_voice(method='auto')
        elif tts_choice == '3':
            run_pipeline_with_voice(method='offline')
        elif tts_choice == '4':
            run_pipeline_with_voice(method='online')
        else:
            print("❌ Invalid choice! Using default (Auto Voice)")
            run_pipeline_with_voice(method='auto')

    elif choice == '2':
        print("\n🎯 Running IELTS Mode (RAG)...\n")
        run_ielts_mode()
    else:
        print("❌ Invalid choice! Defaulting to Practice Mode (Auto Voice)")
        run_pipeline_with_voice(method='auto')


if __name__ == "__main__":
    main()
