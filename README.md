# 🎙️ EngliTut — AI-Powered English Learning Assistant for the Visually Impaired

> A voice-only English language learning system built for accessibility — no screen required.

EngliTut is a Final Year Project (FYP-I, Fall 2025) that combines an ESP32 hardware layer with a Python/Flask AI backend to deliver a fully hands-free, screen-free English tutoring experience for visually impaired users.

---

## 📌 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Hardware Components](#hardware-components)
- [Software Stack](#software-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Session Flow](#session-flow)
- [Features](#features)
- [Known Issues & Fixes](#known-issues--fixes)
- [Future Work](#future-work)
- [Team](#team)

---

## Overview

EngliTut is designed entirely around voice interaction. The user speaks into a microphone connected to an ESP32 microcontroller. The audio is streamed to a PC-based Flask server, where it is transcribed, analyzed for grammar and language errors, and corrected — then a natural-language audio response is played back through a speaker. No touchscreen, no keyboard, no display.

**Target Users:** Visually impaired individuals learning or practising English as a second language.

---

## System Architecture

```
┌─────────────────────────────┐        HTTP (Wi-Fi)       ┌──────────────────────────────────┐
│         ESP32 Device         │ ─────────────────────────▶│         Flask Backend (PC)        │
│                              │                           │                                  │
│  Mic (HW-484 v0.2)          │   POST /api/esp32/audio   │  Groq Whisper  → Transcription   │
│  GPIO 34 (ADC input)        │ ─────────────────────────▶│  LLaMA-3.3-70b → Correction      │
│  DAC GPIO 25 (audio out)    │                           │  gTTS / pyttsx3 → TTS Response   │
│  GF1002 Amplifier           │◀─────────────────────────│                                  │
│  Auto-loop recording        │   WAV audio response      │  /api/esp32/prompt  (boot msg)   │
└─────────────────────────────┘                           └──────────────────────────────────┘
```

---

## Hardware Components

| Component | Details |
|-----------|---------|
| Microcontroller | ESP32 (dual-core, Wi-Fi capable) |
| Microphone | HW-484 v0.2 (analog, connected to GPIO 34 / ADC1_CH6) |
| Amplifier | GF1002 (connected to DAC output GPIO 25) |
| Speaker | Small 8Ω speaker driven via GF1002 |
| Power | USB or LiPo battery |

**Audio format recorded by ESP32:**
- Sample rate: 8 kHz
- Bit depth: 8-bit unsigned PCM
- Resampled on the backend to 16 kHz (16-bit signed PCM) for Whisper compatibility
- DAC DC offset applied to prevent GF1002 hum on silence

---

## Software Stack

### Backend (PC / Server)

| Layer | Technology |
|-------|-----------|
| Web Framework | Python + Flask |
| Speech-to-Text | Groq Whisper (`whisper-large-v3`) |
| Language Model | Groq LLaMA-3.3-70b (grammar correction & feedback) |
| Text-to-Speech | gTTS (primary) / pyttsx3 (offline fallback) |
| Audio Processing | `scipy`, `numpy` (resampling 8kHz → 16kHz) |

### Firmware (ESP32)

| Layer | Technology |
|-------|-----------|
| Framework | Arduino (ESP32 Arduino Core) |
| HTTP Client | `HTTPClient.h` |
| Audio Recording | `driver/adc.h`, `driver/dac.h` |
| Wi-Fi | `WiFi.h` |

---

## Project Structure

```
EngliTut/
├── firmware/
│   └── engliTut_esp32/
│       └── engliTut_esp32.ino      # ESP32 Arduino firmware
│
├── backend/
│   ├── app.py                      # Main Flask application
│   ├── audio_utils.py              # 8kHz→16kHz resampling, WAV handling
│   ├── llm_utils.py                # Groq API calls (Whisper + LLaMA)
│   ├── tts_utils.py                # gTTS / pyttsx3 TTS generation
│   └── requirements.txt            # Python dependencies
│
├── docs/
│   └── architecture_diagram.png    # System block diagram
│
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Python 3.9+
- ESP32 with Arduino IDE (or PlatformIO)
- Groq API key → [console.groq.com](https://console.groq.com)
- Both PC and ESP32 on the same Wi-Fi network

---

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/SzabGitLrk/FYP-I-Fall_2025-.git
cd FYP-I-Fall_2025-

# Install dependencies
pip install -r backend/requirements.txt

# Set your Groq API key
export GROQ_API_KEY=your_key_here   # Linux/macOS
set GROQ_API_KEY=your_key_here      # Windows

# Run the Flask server
python backend/app.py
```

The server runs on `http://0.0.0.0:5000` by default.

---

### ESP32 Firmware Setup

1. Open `firmware/engliTut_esp32/engliTut_esp32.ino` in Arduino IDE.
2. Update the following in the firmware:
   ```cpp
   const char* ssid     = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverIP = "YOUR_PC_LOCAL_IP";  // e.g., "192.168.1.10"
   ```
3. Select your ESP32 board and COM port.
4. Upload the firmware.

---

## API Endpoints

### `GET /api/esp32/prompt`
Returns a WAV audio file containing the boot welcome message.
- Called once on ESP32 startup.
- Response: `audio/wav`

---

### `POST /api/esp32/audio`
Main endpoint for the learning loop.

- **Request:** Raw audio body (`audio/octet-stream`), 8kHz 8-bit unsigned PCM
- **Response:** WAV audio file with the corrected English response
- **Special headers in response:**
  - `X-Exit: true` — Signals ESP32 to end the session (sent when user says "exit", "quit", "stop", "bye", or "goodbye")
- Every response audio ends with the phrase **"Please speak now."** to prompt the user.

---

## Session Flow

```
[Boot]
  │
  ▼
GET /api/esp32/prompt  →  Play welcome message
  │
  ▼
[Recording Loop]
  │
  ├─▶ Record audio (auto-loop, silence detection)
  │
  ├─▶ POST /api/esp32/audio
  │       │
  │       ├─ Resample 8kHz → 16kHz
  │       ├─ Transcribe via Groq Whisper
  │       ├─ Check for exit keywords → X-Exit: true (if detected)
  │       ├─ Check for silence/empty input → skip round
  │       ├─ Send to LLaMA-3.3-70b for grammar correction & feedback
  │       └─ Convert response to WAV via gTTS → return audio
  │
  ├─▶ Play response audio on speaker
  │
  └─▶ Repeat (unless X-Exit: true received)

[Exit]
  └─▶ Play goodbye message → halt
```

---

## Features

- ✅ **Fully voice-operated** — zero screen interaction required
- ✅ **Real-time English correction** — grammar, vocabulary, and sentence structure feedback via LLaMA-3.3-70b
- ✅ **Groq Whisper transcription** — fast and accurate speech-to-text
- ✅ **Boot welcome prompt** — user is greeted on device startup
- ✅ **Exit keyword detection** — "exit", "quit", "stop", "bye", "goodbye" end the session gracefully
- ✅ **Silence detection** — empty audio rounds are skipped automatically
- ✅ **DAC hum fix** — DC offset correction prevents GF1002 amplifier noise
- ✅ **8kHz → 16kHz resampling** — correct Whisper-compatible audio pipeline

---

## Known Issues & Fixes

| Issue | Fix Applied |
|-------|-------------|
| GF1002 amplifier hum on silence | DC offset (128) added to DAC output to center waveform |
| Whisper rejects 8kHz audio | Resampled to 16kHz 16-bit signed PCM before API call |
| ESP32 ADC reads unsigned 0–255 | Converted to signed before WAV encoding on backend |
| Empty transcriptions causing errors | Silence detection skips rounds with no speech content |

---

## Future Work

- [ ] Add multiple lesson modes (vocabulary, pronunciation, sentence building)
- [ ] Persist user progress across sessions
- [ ] Mobile hotspot auto-connect for portability
- [ ] Offline TTS fallback fully integrated (pyttsx3)
- [ ] Add confidence scoring for user's English level tracking
- [ ] Multi-language UI instructions (Urdu, Arabic) for onboarding

---

## Team

**SZABIST University — FYP-I, Fall 2025**

> EngliTut — Bridging the accessibility gap in English language education through AI and embedded systems.

---

## License

This project is developed for academic purposes as part of the Final Year Project program at SZABIST University.
