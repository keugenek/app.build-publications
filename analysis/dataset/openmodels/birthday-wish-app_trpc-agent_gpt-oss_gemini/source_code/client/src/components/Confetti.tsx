import React, { useEffect, useRef } from 'react';

// Simple confetti using canvas. This is a lightweight implementation suitable for static sites.
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; r: number; d: number; color: string; tilt: number; tiltAngleIncremental: number; tiltAngle: number }[] = [];
    const colors = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7'];
    const maxCount = 150;
    const gravity = 0.5;
    
    const drag = 0.075;

    const initParticle = () => {
      const x = Math.random() * width;
      const y = Math.random() * -height;
      const r = randomFromTo(5, 30);
      const d = randomFromTo(2, 10);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const tilt = Math.random() * 10 - 10;
      const tiltAngleIncremental = Math.random() * 0.07 + 0.05;
      const tiltAngle = 0;
      particles.push({ x, y, r, d, color, tilt, tiltAngleIncremental, tiltAngle });
    };

    const randomFromTo = (min: number, max: number) => Math.random() * (max - min) + min;

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        p.y += (Math.cos(p.d) + gravity + p.d) * 0.5;
        p.x += Math.sin(p.d);
        p.d += drag;
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();
      });
    };

    const animate = () => {
      requestAnimationFrame(animate);
      render();
    };

    for (let i = 0; i < maxCount; i++) initParticle();
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}
