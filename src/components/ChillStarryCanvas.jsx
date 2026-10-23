import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, CloudRain, Sparkles, Moon } from 'lucide-react';

export default function ChillStarryCanvas({ isPlaying = true, isChillMode = true }) {
  const canvasRef = useRef(null);
  const [rainEnabled, setRainEnabled] = useState(false);
  const [rainVolume, setRainVolume] = useState(0.35);
  const audioCtxRef = useRef(null);
  const rainGainNodeRef = useRef(null);

  // 1. Web Audio API Procedural Rain Synthesizer (Zero network download, 100% smooth)
  useEffect(() => {
    if (!rainEnabled) {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Generate 5-second pink noise buffer for soft, cozy rainfall sound
      const bufferSize = ctx.sampleRate * 5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Dual filters for soothing soft rain resonance
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1100;

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 220;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(rainVolume, ctx.currentTime);
      rainGainNodeRef.current = gainNode;

      noiseSource.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start(0);
    } catch (err) {
      console.warn("Rain synthesizer error:", err);
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
        audioCtxRef.current = null;
      }
    };
  }, [rainEnabled]);

  // Update rain volume live
  useEffect(() => {
    if (rainGainNodeRef.current && audioCtxRef.current) {
      try {
        rainGainNodeRef.current.gain.setValueAtTime(rainVolume, audioCtxRef.current.currentTime);
      } catch (e) {}
    }
  }, [rainVolume]);

  // 2. High-Performance 60FPS Starry Sky & Meteor Shower Canvas Engine
  useEffect(() => {
    if (!isChillMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };
    window.addEventListener('resize', handleResize);

    // Multi-color palette for celestial stars
    const starColors = ['#ffffff', '#e0e7ff', '#c7d2fe', '#fef08a', '#e9d5ff', '#a5f3fc'];

    // Star collection
    let stars = [];
    const starCount = Math.min(260, Math.floor((width * height) / 5000));

    function initStars() {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.6 + 0.4,
          baseAlpha: Math.random() * 0.7 + 0.25,
          alpha: 0.5,
          twinkleSpeed: Math.random() * 0.03 + 0.008,
          phase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }
    }
    initStars();

    // Fireflies / Cosmic Dust Particles (Drifting gently)
    const fireflyCount = 22;
    const fireflies = [];
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1.2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: -Math.random() * 0.4 - 0.15,
        alpha: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        color: Math.random() > 0.4 ? 'rgba(0, 242, 254,' : 'rgba(192, 132, 252,'
      });
    }

    // Shooting Stars (Meteors)
    const shootingStars = [];
    let lastSpawnTime = Date.now();
    let nextSpawnDelay = 2000;

    function spawnShootingStar() {
      // Pick random angle diagonally falling down-left or down-right
      const toLeft = Math.random() > 0.3;
      const angle = toLeft ? (Math.PI * 0.78 + (Math.random() - 0.5) * 0.15) : (Math.PI * 0.22 + (Math.random() - 0.5) * 0.15);
      const speed = Math.random() * 10 + 13;
      const length = Math.random() * 120 + 90;

      shootingStars.push({
        x: toLeft ? (Math.random() * (width * 0.7) + width * 0.3) : (Math.random() * (width * 0.5)),
        y: Math.random() * (height * 0.35) - 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        life: 0,
        maxLife: Math.floor(Math.random() * 35 + 45),
        color: Math.random() > 0.5 ? '#ffffff' : (Math.random() > 0.5 ? '#a78bfa' : '#67e8f9')
      });
    }

    // Main Canvas Render Loop
    let time = 0;
    const render = () => {
      time += 0.016;

      // 1. Draw Deep Cosmic Midnight Gradient
      ctx.clearRect(0, 0, width, height);

      const cosmicGrad = ctx.createRadialGradient(
        width * 0.45, height * 0.35, 10,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.85
      );
      cosmicGrad.addColorStop(0, '#15132d');
      cosmicGrad.addColorStop(0.35, '#0d0e21');
      cosmicGrad.addColorStop(0.7, '#080812');
      cosmicGrad.addColorStop(1, '#05050a');

      ctx.fillStyle = cosmicGrad;
      ctx.fillRect(0, 0, width, height);

      // Aurora / Nebula Soft Cloud Glow
      const nebulaGrad = ctx.createRadialGradient(
        width * 0.75, height * 0.2, 50,
        width * 0.75, height * 0.2, width * 0.5
      );
      nebulaGrad.addColorStop(0, 'rgba(168, 85, 247, 0.09)');
      nebulaGrad.addColorStop(0.5, 'rgba(0, 242, 254, 0.04)');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Twinkling Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const pulse = Math.sin(time * s.twinkleSpeed * 60 + s.phase);
        const dynamicAlpha = Math.max(0.12, Math.min(1.0, s.baseAlpha + pulse * (isPlaying ? 0.38 : 0.22)));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = dynamicAlpha;
        ctx.fill();

        // Soft halo on larger stars
        if (s.radius > 1.4) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = dynamicAlpha * 0.2;
          ctx.fill();
        }
      }

      // 3. Render Floating Cosmic Fireflies
      for (let i = 0; i < fireflies.length; i++) {
        const f = fireflies[i];
        f.x += f.speedX + Math.sin(time * 1.5 + f.phase) * 0.4;
        f.y += f.speedY;

        // Wrap around borders
        if (f.y < -20) f.y = height + 20;
        if (f.x < -20) f.x = width + 20;
        if (f.x > width + 20) f.x = -20;

        const pulse = (Math.sin(time * f.pulseSpeed * 60 + f.phase) + 1) / 2;
        const currentAlpha = f.alpha * pulse;

        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 3.5);
        grad.addColorStop(0, `${f.color} ${currentAlpha})`);
        grad.addColorStop(0.4, `${f.color} ${currentAlpha * 0.4})`);
        grad.addColorStop(1, `${f.color} 0)`);

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1;
        ctx.fill();
      }

      // 4. Spawn & Render Shooting Stars (Meteors)
      const now = Date.now();
      if (now - lastSpawnTime > nextSpawnDelay) {
        spawnShootingStar();
        lastSpawnTime = now;
        nextSpawnDelay = Math.random() * 2800 + 1600; // 1.6s - 4.4s interval
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const m = shootingStars[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life++;

        // Calculate opacity fade curve (fade in quick, fade out smooth)
        const progress = m.life / m.maxLife;
        let opacity = 1;
        if (progress < 0.2) {
          opacity = progress / 0.2;
        } else {
          opacity = Math.max(0, 1 - (progress - 0.2) / 0.8);
        }

        // Tail coordinate
        const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
        const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

        // Draw gradient tail
        const meteorGrad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        meteorGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.95})`);
        meteorGrad.addColorStop(0.3, `rgba(192, 132, 252, ${opacity * 0.65})`);
        meteorGrad.addColorStop(0.7, `rgba(0, 242, 254, ${opacity * 0.25})`);
        meteorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = meteorGrad;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Meteor Head Glow Point
        const headGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 6);
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        headGlow.addColorStop(0.5, `rgba(168, 85, 247, ${opacity * 0.7})`);
        headGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.beginPath();
        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = headGlow;
        ctx.fill();

        // Remove expired meteor
        if (m.life >= m.maxLife || m.x < -100 || m.x > width + 100 || m.y > height + 100) {
          shootingStars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isChillMode, isPlaying]);

  if (!isChillMode) return null;

  return (
    <>
      {/* Fixed Background Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.8s ease'
        }}
      />

      {/* Floating Chill Mode Ambient Sound Widget (Bottom-right corner) */}
      <div
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          zIndex: 90,
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85), rgba(30, 27, 75, 0.9))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(192, 132, 252, 0.35)',
          borderRadius: '24px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.25)',
          animation: 'fadeInScale 0.3s ease-out'
        }}
      >
        <button
          onClick={() => setRainEnabled(!rainEnabled)}
          title={rainEnabled ? "Tắt tiếng mưa" : "Bật tiếng mưa rào êm dịu (Rain Ambient)"}
          style={{
            background: rainEnabled ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            border: rainEnabled ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.15)',
            color: rainEnabled ? '#c084fc' : 'rgba(255, 255, 255, 0.65)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <CloudRain size={16} />
        </button>

        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🌧️ Tiếng Mưa:</span>
          <span style={{ color: rainEnabled ? '#38bdf8' : 'var(--text-muted)' }}>
            {rainEnabled ? 'Bật' : 'Tắt'}
          </span>
        </span>

        {rainEnabled && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={rainVolume}
            onChange={(e) => setRainVolume(parseFloat(e.target.value))}
            style={{
              width: '70px',
              height: '4px',
              accentColor: '#38bdf8',
              cursor: 'pointer'
            }}
            title={`Âm lượng mưa: ${Math.round(rainVolume * 100)}%`}
          />
        )}
      </div>
    </>
  );
}
