import React, { useEffect, useRef } from 'react';
import { X, Activity } from 'lucide-react';

export default function VisualizerModal({ audioRef, isPlaying, onClose }) {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let audioCtx;
    let analyser;
    let source;

    try {
      if (audioRef.current && !audioRef.current._analyser) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source = audioCtx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        audioRef.current._analyser = analyser;
      } else {
        analyser = audioRef.current._analyser;
      }
    } catch (e) {
      console.log('Visualizer AudioContext fallback:', e);
    }

    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Simulated ambient pulse when paused
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(Date.now() * 0.003 + i) * 30 + 40;
        }
      }

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (height * 0.75);

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#a238ff');
        gradient.addColorStop(0.5, '#00f2fe');
        gradient.addColorStop(1, '#ff2a74');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2fe';

        ctx.fillRect(x, height - barHeight, barWidth - 4, barHeight);

        x += barWidth;
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, audioRef]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-secondary)' }}>
            <Activity size={24} /> Visualizer Sóng Nhạc Neon (Web Audio API)
          </h3>
          <button onClick={onClose} className="control-btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ width: '100%', height: '360px', position: 'relative' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
        </div>
      </div>
    </div>
  );
}
