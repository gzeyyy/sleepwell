import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createAudioBlob, base64ToUint8Array, pcmToAudioBuffer, downsampleTo16k } from '../services/audioUtils';
import { VoiceName, ChatMessage, TranscriptState } from '../types';

interface UseLiveSessionProps {
  onVisualizerUpdate: (volume: number, isAiSpeaking: boolean) => void;
}

export const useLiveSession = ({ onVisualizerUpdate }: UseLiveSessionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [realtimeTranscript, setRealtimeTranscript] = useState<TranscriptState>({ user: '', ai: '' });
  
  // Refs for audio context and session management
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Refs for transcription accumulation
  const currentInputRef = useRef<string>('');
  const currentOutputRef = useRef<string>('');

  const disconnect = useCallback(() => {
    // 1. Close session
    sessionPromiseRef.current = null;

    // 2. Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // 3. Disconnect input
    if (inputProcessorRef.current) {
      inputProcessorRef.current.disconnect();
      inputProcessorRef.current = null;
    }

    // 4. Close Audio Contexts
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    
    // 5. Stop audio
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();

    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    setIsConnected(false);
    onVisualizerUpdate(0, false);
    setRealtimeTranscript({ user: '', ai: '' });
  }, [onVisualizerUpdate]);

  const connect = useCallback(async (voiceName: VoiceName, systemInstruction: string) => {
    try {
      setError(null);
      currentInputRef.current = '';
      currentOutputRef.current = '';
      setRealtimeTranscript({ user: '', ai: '' });

      // Initialize Audio Contexts
      // Note: We don't force sampleRate here because some browsers ignore it. 
      // We handle resampling in the processor.
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Critical: Resume contexts in case they are suspended
      await inputCtx.resume();
      await outputCtx.resume();

      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            setIsConnected(true);

            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            inputProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // 1. Calculate Volume for Visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              onVisualizerUpdate(rms * 5, false);

              // 2. Downsample to 16kHz for Gemini
              // Using inputCtx.sampleRate ensures we handle 44.1k/48k correctly
              const downsampledData = downsampleTo16k(inputData, inputCtx.sampleRate);
              const blob = createAudioBlob(downsampledData);
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ media: blob });
                });
              }
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;
            
            if (serverContent?.inputTranscription?.text) {
              currentInputRef.current += serverContent.inputTranscription.text;
              setRealtimeTranscript(prev => ({ ...prev, user: currentInputRef.current }));
            }
            if (serverContent?.outputTranscription?.text) {
              currentOutputRef.current += serverContent.outputTranscription.text;
              setRealtimeTranscript(prev => ({ ...prev, ai: currentOutputRef.current }));
            }

            if (serverContent?.turnComplete) {
              const userText = currentInputRef.current.trim();
              const aiText = currentOutputRef.current.trim();

              if (userText || aiText) {
                 setHistory(prev => {
                   const newItems: ChatMessage[] = [];
                   if (userText) newItems.push({ role: 'user', text: userText, timestamp: Date.now() });
                   if (aiText) newItems.push({ role: 'ai', text: aiText, timestamp: Date.now() });
                   return [...prev, ...newItems];
                 });
                 currentInputRef.current = '';
                 currentOutputRef.current = '';
                 setTimeout(() => {
                    setRealtimeTranscript({ user: '', ai: '' });
                 }, 1000);
              }
            }

            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current) {
              const ctx = outputContextRef.current;
              
              onVisualizerUpdate(0.5 + Math.random() * 0.3, true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const pcmData = base64ToUint8Array(base64Audio);
              const audioBuffer = await pcmToAudioBuffer(pcmData, ctx, 24000);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              const gainNode = ctx.createGain();
              gainNode.gain.value = 1.0; 
              
              source.connect(gainNode);
              gainNode.connect(ctx.destination);
              
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) {
                  onVisualizerUpdate(0, false);
                }
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            if (serverContent?.interrupted) {
                console.log('Model interrupted');
                activeSourcesRef.current.forEach(s => s.stop());
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                onVisualizerUpdate(0, false);
                currentOutputRef.current = '';
                setRealtimeTranscript(prev => ({ ...prev, ai: '' }));
            }
          },
          onclose: () => {
            console.log('Gemini Live Session Closed');
            disconnect();
          },
          onerror: (err) => {
            console.error('Gemini Live Error', err);
            setError("网络连接中断，请检查权限或重试");
            disconnect();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError(e.message || "无法启动会话");
      disconnect();
    }
  }, [disconnect, onVisualizerUpdate]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return { isConnected, connect, disconnect, error, history, realtimeTranscript };
};