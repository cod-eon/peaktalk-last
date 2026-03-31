'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (onResult?: (text: string, isFinal: boolean) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
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

    recognition.onresult = (event: any) => {
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

    recognition.onerror = (event: any) => {
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
        } catch (e) {}
      }
    };
  }, [onResult]);

  const startListening = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.log('Recognition already started');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {}
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
  };
};
