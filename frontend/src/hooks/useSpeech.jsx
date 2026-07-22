import { useState } from "react";

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [audioUrl, setAudioUrl] = useState(null);

  const speakReport = async (text) => {
    setIsSpeaking(true);
    setAudioUrl(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: selectedLanguage }),
      });

      const data = await response.json();

      if (data.audio) {
        setAudioUrl(data.audio);
      } else {
        console.error("No audio url returned", data);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      alert("Failed to generate voice.");
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    setAudioUrl(null);
    setIsSpeaking(false);
  };

  return { isSpeaking, selectedLanguage, setSelectedLanguage, speakReport, stopSpeaking, audioUrl };
};