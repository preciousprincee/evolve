import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Name substrings for the common built-in voices across Chrome/Edge
// (Google …), Safari/macOS/iOS (Apple's Siri/compact voices), and Windows
// (Microsoft …) — the Web Speech API doesn't expose a real gender field, so
// this is the standard approach for guessing it from the voice's name.
const FEMALE_VOICE_HINTS = [
  'female', 'samantha', 'victoria', 'zira', 'susan', 'linda', 'karen',
  'moira', 'tessa', 'fiona', 'zoe', 'aria', 'jenny', 'google us english',
];
const MALE_VOICE_HINTS = [
  'male', 'daniel', 'david', 'alex', 'fred', 'mark', 'james', 'oliver',
  'guy', 'ryan', 'google uk english male',
];

function pickVoiceForGender(gender) {
  if (!gender || typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang?.startsWith('en'));
  if (voices.length === 0) return null;

  const hints = gender === 'female' ? FEMALE_VOICE_HINTS : MALE_VOICE_HINTS;
  const match = voices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  if (match) return match;

  // No confident name match — fall back to a default English voice rather
  // than picking the wrong gender at random.
  return voices.find((v) => v.default) || voices[0];
}

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
  // Tracks whether listening *should* still be active, independent of the
  // browser's own recognition.onend firing. Needed because continuous mode
  // still ends on its own after a long silence or a mobile timeout — this
  // lets us tell "user stopped it" apart from "the browser stopped it" and
  // auto-restart only in the latter case, which is what actually fixes
  // voice input cutting out after a short time.
  const shouldListenRef = useRef(false);
  const onResultRef = useRef(null);

  const speechRecognitionSupported = Boolean(SpeechRecognitionCtor);
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const createAndStartRecognition = useCallback(() => {
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    // Continuous, not one-shot: without this the browser stops listening
    // as soon as it detects a single pause, which is what made voice input
    // feel like it "didn't last long" — most people pause between
    // thoughts mid-sentence.
    recognition.continuous = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      const lastResult = event.results[event.results.length - 1];
      const isFinal = lastResult?.isFinal ?? false;
      // In continuous mode, `transcript` above accumulates every segment
      // spoken since recognition.start(). `segment` is just the most
      // recent one (interim or freshly finalized) — what Call mode needs
      // to treat each pause as a discrete turn instead of resending
      // everything said so far.
      const segment = lastResult?.[0]?.transcript ?? '';
      onResultRef.current?.(transcript, isFinal, segment);
    };
    recognition.onerror = (event) => {
      // 'no-speech' fires often and isn't fatal — let onend's restart
      // logic handle it rather than giving up on the whole session.
      if (event.error !== 'no-speech') {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };
    recognition.onend = () => {
      // The browser ends recognition on its own periodically (long
      // silence, ~60s mobile cap, etc.) even in continuous mode. If the
      // user hasn't explicitly stopped, transparently restart so it feels
      // continuous from their side.
      if (shouldListenRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Already started or otherwise unable to restart — fall through
          // and report as stopped rather than looping on the error.
        }
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const startListening = useCallback(
    (onResult) => {
      if (!speechRecognitionSupported) return;
      onResultRef.current = onResult;
      shouldListenRef.current = true;
      createAndStartRecognition();
    },
    [speechRecognitionSupported, createAndStartRecognition]
  );

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  /**
   * Speaks a reply aloud. `romantic` shifts delivery — slightly slower
   * pace and a touch warmer pitch — echoing the same tender register
   * Romantic Mode already asks for in the text itself (companionPrompt.js),
   * rather than introducing an unrelated voice change. `voiceGender`
   * ('male' | 'female') picks which voice to speak in — pass the opposite
   * of the user's own gender (see opposingVoiceGender in
   * constants/relationship.js) so the companion doesn't sound like the
   * user's own mirror.
   */
  const speak = useCallback(
    (text, { romantic = false, voiceGender = null, onEnd } = {}) => {
      if (!speechSynthesisSupported || !text?.trim()) return;

      window.speechSynthesis.cancel(); // don't overlap with a previous reply
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = romantic ? 0.92 : 1;
      utterance.pitch = romantic ? 1.08 : 1;
      utterance.volume = 1;
      const voice = pickVoiceForGender(voiceGender);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

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
    // Some browsers (notably Chrome) load the voice list asynchronously —
    // getVoices() can return [] on the very first call. Triggering it once
    // here (and again once the async list is ready) means the real
    // speak() calls later in the session reliably see a populated list
    // instead of racing it on the first reply.
    if (speechSynthesisSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      shouldListenRef.current = false; // prevent onend from auto-restarting after unmount
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
