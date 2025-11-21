
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, StopCircle, Smile, Ghost } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface Props {
  textToRead: string;
}

export const TTSToolbar: React.FC<Props> = ({ textToRead }) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [character, setCharacter] = useState<'cute' | 'donald'>('cute');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setPlaying(false);
  };

  const handlePlay = async () => {
    if (playing) {
      stopAudio();
      return;
    }

    setLoading(true);
    try {
      // Cleanup old context if needed or just reuse if strictly managing lifecycle
      if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      
      const audioBuffer = await generateSpeech(textToRead, character);
      
      const ctx = audioContextRef.current;
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => setPlaying(false);
      
      sourceRef.current = source;
      source.start();
      setPlaying(true);
    } catch (e) {
      console.error("TTS Error", e);
      alert("语音生成失败，请稍后重试 (TTS Generation Failed)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mr-2">
        <span>语音播报 (TTS):</span>
      </div>

      {/* Voice Selector */}
      <div className="flex bg-white rounded-full border border-slate-200 p-1">
        <button
          onClick={() => { stopAudio(); setCharacter('cute'); }}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
             character === 'cute' ? 'bg-pink-100 text-pink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Smile size={14} />
          萌娃
        </button>
        <button
           onClick={() => { stopAudio(); setCharacter('donald'); }}
           className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              character === 'donald' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
           }`}
        >
          <Ghost size={14} />
          唐老鸭
        </button>
      </div>

      {/* Play Button */}
      <button
        onClick={handlePlay}
        disabled={loading}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
          playing 
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : playing ? (
          <StopCircle size={18} fill="currentColor" />
        ) : (
          <Volume2 size={18} />
        )}
      </button>
    </div>
  );
};
