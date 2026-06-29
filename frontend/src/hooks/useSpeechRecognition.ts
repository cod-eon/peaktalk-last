'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  webkitAudioContext?: typeof AudioContext;
};

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const browserWindow = window as BrowserWindow;
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
}

export const useSpeechRecognition = (onResult?: (text: string, isFinal: boolean) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => Boolean(getSpeechRecognitionCtor()));
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = getSpeechRecognitionCtor();

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let currentFinal = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        if (currentFinal) {
          onResult(currentFinal.trim(), true);
        }
        if (currentInterim) {
          onResult(currentInterim.trim(), false);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [onResult]);

  // Haptic and audio feedback generator
  const triggerFeedback = useCallback((type: 'start' | 'stop') => {
    // 1. Haptic feedback (Android only, ignored on iOS safari)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'start') navigator.vibrate([15]); // short light tap
      else navigator.vibrate([10, 50, 10]); // double tap
    }

    // 2. Audio feedback for Safari/Desktop (via Web Audio API)
    try {
      const browserWindow = window as BrowserWindow;
      const AudioContextCtor = typeof AudioContext !== 'undefined' ? AudioContext : browserWindow.webkitAudioContext;
      if (AudioContextCtor) {
        const ctx = new AudioContextCtor();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'start') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
        }
      }
    } catch {
      // AudioContext might be blocked or unsupported, fail completely silently
    }
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      triggerFeedback('start');
    } catch {
      console.log('Recognition already started');
    }
  }, [triggerFeedback]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      triggerFeedback('stop');
    } catch {}
  }, [triggerFeedback]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
  };
};
