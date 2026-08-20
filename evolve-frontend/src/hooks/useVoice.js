import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

/**
 * Voice in/out for the chat screen, built entirely on the browser's native
 * Web Speech API — no backend endpoint, no third-party voice API cost.
 * Support varies by browser (notably: no SpeechRecognition in Firefox), so
 * every consumer should check the *Supported flags before showing controls.
 */
export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const speechRecognitionSupported = Boolean(SpeechRecognitionCtor);
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const startListening = useCallback(
    (onResult) => {
      if (!speechRecognitionSupported) return;

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join('');
        const isFinal = event.results[event.results.length - 1]?.isFinal ?? false;
        onResult(transcript, isFinal);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [speechRecognitionSupported]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  /**
   * Speaks a reply aloud. `romantic` shifts delivery — slightly slower
   * pace and a touch warmer pitch — echoing the same tender register
   * Romantic Mode already asks for in the text itself (companionPrompt.js),
   * rather than introducing an unrelated voice change.
   */
  const speak = useCallback(
    (text, { romantic = false } = {}) => {
      if (!speechSynthesisSupported || !text?.trim()) return;

      window.speechSynthesis.cancel(); // don't overlap with a previous reply
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = romantic ? 0.92 : 1;
      utterance.pitch = romantic ? 1.08 : 1;
      utterance.volume = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [speechSynthesisSupported]
  );

  const cancelSpeech = useCallback(() => {
    if (speechSynthesisSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [speechSynthesisSupported]);

  // Stop everything on unmount (navigating away from Chat) — nothing
  // should keep listening or talking once the screen is gone.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (speechSynthesisSupported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isListening,
    isSpeaking,
    speechRecognitionSupported,
    speechSynthesisSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
}
