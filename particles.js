// Ambient particle field background — Mobile-optimized with high-performance adaptive density
(function () {
  const c = document.getElementById('particle-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, pts = [];
  let isMobile = false;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    isMobile = W <= 768 || ('ontouchstart' in window);
    const count = isMobile ? 24 : Math.min(100, Math.floor((W * H) / 16000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.35),
      vy: (Math.random() - 0.5) * (isMobile ? 0.2 : 0.35),
      r: Math.random() * 1.5 + 0.5
    }));
  }

  function draw() {
    if (document.hidden) {
      setTimeout(() => requestAnimationFrame(draw), 200);
      return;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0, 245, 255, 0.45)';

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fill();

      // Only perform edge distance connections on desktop to save mobile main-thread CPU
      if (!isMobile) {
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 10000) {
            const alpha = (1 - distSq / 10000) * 0.22;
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => { resize(); requestAnimationFrame(draw); }, { timeout: 1200 });
  } else {
    setTimeout(() => { resize(); requestAnimationFrame(draw); }, 600);
  }
})();
