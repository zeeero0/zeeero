
import React, { useState, useEffect } from 'react';
import { startVideoGeneration, pollVideoOperation } from '../services/geminiService';

const VideoModule: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // Note: Assuming window.aistudio helper exists as per instructions
    try {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per race condition instructions
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setVideoUrl(null);
    setStatus('Initializing production sequence...');

    try {
      let operation = await startVideoGeneration(prompt);
      setStatus('Engine warming up... Veo is imagining your scene.');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await pollVideoOperation(operation);
        
        const messages = [
          "Allocating cinematic frames...",
          "Simulating physics and motion...",
          "Polishing lighting and textures...",
          "Almost ready for premiere..."
        ];
        setStatus(messages[Math.floor(Math.random() * messages.length)]);
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        setStatus('Ready for viewing.');
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("API key session expired. Please select key again.");
      } else {
        alert("Video generation failed. Veo might be busy.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="max-w-md glass p-10 rounded-3xl text-center border-t-4 border-t-pink-500">
          <i className="fas fa-key text-5xl mb-6 text-pink-500"></i>
          <h2 className="text-3xl font-bold mb-4">Veo Access Required</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            High-fidelity video generation requires a dedicated API key from a paid GCP project.
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all shadow-xl"
          >
            Select API Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            className="mt-4 block text-xs text-blue-400 hover:underline"
          >
            Billing Documentation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-full space-y-8">
      <div className="glass p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] -z-10"></div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <i className="fas fa-clapperboard text-pink-500"></i>
          Veo Cinema Studio
        </h2>
        
        <div className="space-y-4">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A neon hologram of a cat driving a sports car at top speed on a futuristic highway..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 h-32 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none transition-all text-lg"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 italic">Veo 3.1 Fast Preview | 720p | 16:9</span>
            <button 
              onClick={handleGenerateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-pink-500/30 flex items-center gap-3"
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  Generating...
                </>
              ) : (
                'Create Video'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center relative">
        {isGenerating ? (
          <div className="text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full mx-auto mb-6 animate-spin"></div>
            <p className="text-xl font-medium">{status}</p>
            <p className="text-sm text-gray-500 mt-2">This usually takes 2-4 minutes.</p>
          </div>
        ) : videoUrl ? (
          <video 
            src={videoUrl} 
            controls 
            autoPlay 
            loop 
            className="w-full h-auto shadow-2xl"
          />
        ) : (
          <div className="text-center opacity-30">
            <i className="fas fa-film text-8xl mb-6"></i>
            <p className="text-xl">Your masterpiece will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModule;
