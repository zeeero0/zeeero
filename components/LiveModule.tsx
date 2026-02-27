
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/geminiService';

const LiveModule: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus('Disconnected');
    
    // Stop all active sources
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    if (isActive) {
      stopSession();
      return;
    }

    try {
      setStatus('Connecting...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      outputNodeRef.current = outputNode;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('Active');
            setIsActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
               setTranscript(prev => [...prev.slice(-10), `Aura: ${message.serverContent.outputTranscription.text}`]);
            }
            if (message.serverContent?.inputTranscription) {
               setTranscript(prev => [...prev.slice(-10), `You: ${message.serverContent.inputTranscription.text}`]);
            }

            // Extract the model's audio output bytes
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current!);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              // Schedule gapless playback
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                try { source.stop(); } catch (e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            setStatus('Error');
          },
          onclose: () => {
            setStatus('Disconnected');
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a helpful real-time creative assistant named Aura. Keep responses concise and human-like.',
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error(error);
      setStatus('Failed to connect');
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center space-y-12">
      <div className="relative">
        {/* Pulsing Visualizer Ring */}
        <div className={`
          absolute -inset-8 rounded-full blur-2xl transition-all duration-700
          ${isActive ? 'bg-green-500/20 opacity-100 animate-pulse' : 'bg-white/5 opacity-0'}
        `}></div>
        
        <button 
          onClick={isActive ? stopSession : startSession}
          className={`
            relative w-48 h-48 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-500
            ${isActive ? 'border-green-500 bg-green-500/10 scale-110 shadow-2xl shadow-green-500/20' : 'border-white/20 bg-white/5 hover:border-white/40'}
          `}
        >
          <i className={`fas ${isActive ? 'fa-microphone' : 'fa-microphone-slash'} text-5xl mb-3`}></i>
          <span className="text-sm font-bold uppercase tracking-widest">
            {isActive ? 'Live' : 'Connect'}
          </span>
        </button>
      </div>

      <div className="text-center">
        <div className={`px-4 py-1 rounded-full text-xs font-bold inline-block mb-2 ${isActive ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
          {status}
        </div>
        <p className="text-gray-400 max-w-sm">
          {isActive ? 'Speak freely. Aura is listening and will respond in real-time.' : 'Start a low-latency conversation with Aura for brainstorming and support.'}
        </p>
      </div>

      <div className="w-full glass rounded-2xl p-6 min-h-[150px] max-h-[300px] overflow-y-auto font-mono text-sm space-y-2">
        <div className="text-gray-500 mb-4 border-b border-white/5 pb-2 uppercase text-[10px] tracking-widest">Live Transcription History</div>
        {transcript.length === 0 && <div className="text-gray-600 italic">No activity yet...</div>}
        {transcript.map((line, i) => (
          <div key={i} className={line.startsWith('Aura:') ? 'text-green-400' : 'text-blue-300'}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveModule;
