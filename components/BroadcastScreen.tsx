import React, { useRef, useEffect } from 'react';
import { GeneratedVisual } from '../types';
import { Loader2, Tv } from 'lucide-react';

interface BroadcastScreenProps {
  visual: GeneratedVisual | null;
  isLoading: boolean;
  onScreenText: string;
}

const BroadcastScreen: React.FC<BroadcastScreenProps> = ({ visual, isLoading, onScreenText }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (visual?.type === 'video' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.error("Autoplay failed", e));
    }
  }, [visual]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-4 border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* Screen Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isLoading && !visual ? (
           <div className="flex flex-col items-center text-cyan-500 animate-pulse">
             <Loader2 size={48} className="animate-spin mb-4" />
             <span className="font-mono uppercase tracking-widest text-sm">Simulating Reality...</span>
           </div>
        ) : visual?.type === 'video' ? (
          <video 
            ref={videoRef}
            src={visual.url} 
            className="w-full h-full object-cover" 
            controls 
            autoPlay 
            loop
          />
        ) : visual?.type === 'image' ? (
          <div className="relative w-full h-full">
             <img src={visual.url} alt="Broadcast" className="w-full h-full object-cover animate-in fade-in duration-700" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="text-slate-600 flex flex-col items-center">
             <Tv size={64} className="mb-4 opacity-50"/>
             <span className="font-mono text-xl uppercase tracking-widest">Signal Lost</span>
          </div>
        )}
      </div>

      {/* Overlay UI (TV Graphics) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
        {onScreenText && (
            <div className="inline-block bg-blue-900/90 text-white px-4 py-2 rounded-sm border-l-4 border-yellow-400 backdrop-blur-sm animate-in slide-in-from-bottom-5">
                <h3 className="font-bold text-lg uppercase italic font-sans leading-none mb-1">Live Commentary</h3>
                <p className="text-lg font-medium leading-tight">{onScreenText}</p>
            </div>
        )}
      </div>

      {/* Scanlines Effect */}
      <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] opacity-[0.03] pointer-events-none mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
    </div>
  );
};

export default BroadcastScreen;
