import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuroraOrb } from '../components/AuroraOrb.jsx';
import { Button } from '../components/Button.jsx';
import { useVoice } from '../hooks/useVoice.js';
import { useChat } from '../hooks/useChat.js';
import { useProfileStore } from '../stores/profileStore.js';
import { opposingVoiceGender } from '../constants/relationship.js';

/**
 * A live, hands-free voice conversation — the "phone call" experience.
 * Loop: listen until the user pauses -> send what they said -> speak the
 * reply -> listen again. Runs on the same conversation/history as the text
 * Chat screen (same chatStore + useChat), so switching between typing and
 * calling mid-conversation stays continuous.
 */
export default function Call() {
  const navigate = useNavigate();
  const { sendMessage, cancelStream } = useChat();
  const {
    isListening,
    speechRecognitionSupported,
    speechSynthesisSupported,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  } = useVoice();

  const [romantic, setRomantic] = useState(false);
  const [phase, setPhase] = useState('listening'); // 'listening' | 'thinking' | 'speaking'
  const [muted, setMuted] = useState(false);
  const [liveCaption, setLiveCaption] = useState('');
  const [seconds, setSeconds] = useState(0);

  // Everything read from inside async/event callbacks (recognition
  // results, speech-end handlers) goes through refs rather than state
  // closures — those callbacks are handed to the browser's Web Speech API
  // once and may fire well after a re-render, so a captured `const` from a
  // stale render would silently use outdated values (e.g. the user's
  // gender/romantic-mode settings before the profile fetch resolved, or
  // acting on a call that's already been ended).
  const romanticRef = useRef(false);
  const voiceGenderRef = useRef(null);
  const callActiveRef = useRef(true);
  const mutedRef = useRef(false);
  const phaseRef = useRef('listening');
  const turnInFlightRef = useRef(false);

  useEffect(() => {
    useProfileStore
      .getState()
      .fetch()
      .then((res) => {
        romanticRef.current = Boolean(res?.profile?.romantic_mode_enabled);
        voiceGenderRef.current = opposingVoiceGender(res?.profile?.gender);
        setRomantic(romanticRef.current);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const resumeListening = useCallback(() => {
    if (!callActiveRef.current || mutedRef.current) return;
    setPhaseBoth('listening');
    startListening(handleResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startListening]);

  const handleResult = useCallback(
    (_fullTranscript, isFinal, segment) => {
      setLiveCaption(segment);
      const trimmed = segment.trim();
      if (!isFinal || !trimmed || turnInFlightRef.current || !callActiveRef.current) return;

      turnInFlightRef.current = true;
      setLiveCaption('');
      stopListening();
      setPhaseBoth('thinking');

      sendMessage(trimmed, {
        onComplete: (fullText) => {
          turnInFlightRef.current = false;
          if (!callActiveRef.current) return; // call was ended while waiting on the reply

          if (!fullText.trim()) {
            // Nothing came back (e.g. an error already rendered in chat) —
            // just resume listening rather than speaking silence.
            resumeListening();
            return;
          }

          setPhaseBoth('speaking');
          speak(fullText, {
            romantic: romanticRef.current,
            voiceGender: voiceGenderRef.current,
            onEnd: resumeListening,
          });
        },
      });
    },
    // sendMessage/speak/stopListening are all stable (wrapped in useCallback
    // upstream), so this can safely be created once and reused across the
    // whole call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendMessage, speak, stopListening, resumeListening]
  );

  // Kick off the call as soon as voice support is confirmed.
  useEffect(() => {
    if (!speechRecognitionSupported || !speechSynthesisSupported) return;
    startListening(handleResult);
    return () => {
      callActiveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechRecognitionSupported, speechSynthesisSupported]);

  const endCall = () => {
    callActiveRef.current = false;
    cancelStream();
    stopListening();
    cancelSpeech();
    navigate('/chat');
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      mutedRef.current = next;
      if (next) {
        stopListening();
      } else if (phaseRef.current === 'listening') {
        startListening(handleResult);
      }
      return next;
    });
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const statusText = muted
    ? 'Muted'
    : phase === 'thinking'
      ? 'Thinking…'
      : phase === 'speaking'
        ? 'Speaking…'
        : liveCaption
          ? `"${liveCaption}"`
          : 'Listening…';

  if (!speechRecognitionSupported || !speechSynthesisSupported) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-ink-muted">
          Your browser doesn't support voice calls (microphone or speech playback isn't available here).
        </p>
        <Button onClick={() => navigate('/chat')}>Back to chat</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-hidden">
      <p className="text-sm text-ink-faint tabular-nums">{mm}:{ss}</p>

      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{
            scale: phase === 'speaking' ? [1, 1.08, 1] : isListening && !muted ? [1, 1.03, 1] : 1,
          }}
          transition={{ duration: phase === 'speaking' ? 0.6 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AuroraOrb size={200} romantic={romantic} />
        </motion.div>
        <p className="text-ink-primary font-display text-lg text-center max-w-xs">{statusText}</p>
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={muted}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            muted ? 'bg-white/10 text-ink-primary' : 'bg-white/[0.06] text-ink-muted'
          }`}
        >
          {muted ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-1M19 11v1a7 7 0 0 1-.11 1.23M12 19v3M2 2l20 20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={endCall}
          aria-label="End call"
          className="w-16 h-16 rounded-full flex items-center justify-center bg-aurora-rose text-void shadow-glass active:scale-95 transition-transform"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" strokeLinecap="round" strokeLinejoin="round" transform="rotate(135 12 12)" />
          </svg>
        </button>

        <div className="w-14" aria-hidden="true" />
      </div>
    </div>
  );
}
