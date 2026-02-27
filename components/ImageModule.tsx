
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { GeneratedImage } from '../types';

const ImageModule: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const url = await generateImage(prompt);
      const newImg: GeneratedImage = {
        id: Date.now().toString(),
        url,
        prompt,
        timestamp: new Date()
      };
      setImages(prev => [newImg, ...prev]);
      setPrompt('');
    } catch (error) {
      console.error(error);
      alert("Failed to generate image.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col gap-8">
      <div className="glass p-8 rounded-3xl">
        <h2 className="text-2xl font-bold mb-4">Dream it. Manifest it.</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city with floating gardens, cinematic lighting, 8k, photorealistic..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 h-24 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all"
          />
          <button 
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 disabled:opacity-50 disabled:scale-100 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Forging...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i>
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
            <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
              <p className="text-sm text-gray-300 line-clamp-3 mb-4 italic">"{img.prompt}"</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = img.url;
                    a.download = `aura-gen-${img.id}.png`;
                    a.click();
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-bold"
                >
                  <i className="fas fa-download mr-2"></i> Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageModule;
