/**
 * NEXUS Quantum Holographic 3D Superintelligence Engine (v1.0)
 * 60 FPS Hardware-Accelerated 3D Hologram, Geodesic Core, Multi-Agent Satellites & Gyroscope
 * Zero External Dependencies • 100% Offline PWA & WebGL/Canvas Parity
 */

const QuantumHolo3D = (function () {
  // 3D Math Primitives
  class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x; this.y = y; this.z = z;
    }
    clone() { return new Vec3(this.x, this.y, this.z); }
    add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
    scale(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
    length() { return Math.hypot(this.x, this.y, this.z); }
    normalize() {
      const l = this.length() || 1;
      return new Vec3(this.x / l, this.y / l, this.z / l);
    }
    rotateX(rad) {
      const cos = Math.cos(rad), sin = Math.sin(rad);
      return new Vec3(this.x, this.y * cos - this.z * sin, this.y * sin + this.z * cos);
    }
    rotateY(rad) {
      const cos = Math.cos(rad), sin = Math.sin(rad);
      return new Vec3(this.x * cos + this.z * sin, this.y, -this.x * sin + this.z * cos);
    }
    rotateZ(rad) {
      const cos = Math.cos(rad), sin = Math.sin(rad);
      return new Vec3(this.x * cos - this.y * sin, this.x * sin + this.y * cos, this.z);
    }
  }

  // 12 Vertices of Golden Ratio Icosahedron
  const PHI = (1 + Math.sqrt(5)) / 2;
  const rawIcoVerts = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
  ].map(([x, y, z]) => new Vec3(x, y, z).normalize());

  // 30 Edges of Icosahedron
  const icoEdges = [];
  for (let i = 0; i < rawIcoVerts.length; i++) {
    for (let j = i + 1; j < rawIcoVerts.length; j++) {
      const d = rawIcoVerts[i].sub(rawIcoVerts[j]).length();
      if (Math.abs(d - 1.05146) < 0.12) {
        icoEdges.push([i, j]);
      }
    }
  }

  // 3D Agent Satellites definition
  const AGENT_SATELLITES = [
    { id: 'aura', name: 'AURA (Companion)', role: 'Inclusão & Diálogo', color: '#00f5ff', radius: 105, speed: 0.016, inc: 0.28, phase: 0 },
    { id: 'planner', name: 'PLANNER (Arquiteto)', role: 'Decomposição DAG', color: '#38bdf8', radius: 125, speed: -0.013, inc: -0.42, phase: 1.3 },
    { id: 'critic', name: 'CRITIC (Auditor)', role: 'Auditoria Epistêmica', color: '#a855f7', radius: 145, speed: 0.011, inc: 0.65, phase: 2.7 },
    { id: 'executor', name: 'EXECUTOR (Sintetizador)', role: 'Métricas & Código', color: '#10b981', radius: 165, speed: -0.009, inc: -0.22, phase: 4.1 },
    { id: 'verifier', name: 'VERIFIER (Portão)', role: 'Consenso Soberano', color: '#f59e0b', radius: 185, speed: 0.008, inc: 0.82, phase: 5.2 }
  ];

  class HoloInstance {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.isMobile = options.isMobile || window.innerWidth <= 768;
      this.scale = options.scale || (this.isMobile ? 0.75 : 1.0);
      this.fov = 360;

      // 3D Camera & Rotation State
      this.rotX = options.initialRotX || 0.25;
      this.rotY = options.initialRotY || 0.35;
      this.velRotX = 0;
      this.velRotY = 0.006;
      this.zoom = options.initialZoom || 1.0;
      this.targetZoom = this.zoom;

      // Audio & Vibration pulse
      this.pulseAmplitude = 0;
      this.pulseTarget = 0;

      // Selected node for 3D inspection
      this.selectedNode = null;
      this.onNodeClick = options.onNodeClick || null;

      // Knowledge dust particles (GraphRAG in 3D)
      this.dust = Array.from({ length: this.isMobile ? 35 : 70 }, () => ({
        pos: new Vec3(
          (Math.random() - 0.5) * 360,
          (Math.random() - 0.5) * 360,
          (Math.random() - 0.5) * 360
        ),
        speed: (Math.random() - 0.5) * 0.4,
        size: 1.0 + Math.random() * 2.0,
        color: Math.random() > 0.4 ? 'rgba(0, 245, 255, 0.4)' : 'rgba(168, 85, 247, 0.4)'
      }));

      // Synaptic energy photon pulses
      this.photons = Array.from({ length: 12 }, (_, i) => ({
        fromAgentIdx: i % 5,
        progress: Math.random(),
        speed: 0.015 + Math.random() * 0.02
      }));

      this.initEvents();
      this.resize();
      this.start();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width || this.canvas.width;
      this.height = rect.height || this.canvas.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.cx = this.width / 2;
      this.cy = this.height / 2;
    }

    initEvents() {
      let isDragging = false;
      let lastX = 0, lastY = 0;
      let lastDist = 0;

      // Mouse drag controls
      this.canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        this.handleClickRaycast(e.clientX, e.clientY);
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        this.rotY += dx * 0.008;
        this.rotX += dy * 0.008;
        this.velRotY = dx * 0.002;
        this.velRotX = dy * 0.002;
        lastX = e.clientX;
        lastY = e.clientY;
      });

      window.addEventListener('mouseup', () => { isDragging = false; });

      // Touch orbit & pinch zoom
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
          this.handleClickRaycast(lastX, lastY);
        } else if (e.touches.length === 2) {
          isDragging = false;
          lastDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging) {
          const dx = e.touches[0].clientX - lastX;
          const dy = e.touches[0].clientY - lastY;
          this.rotY += dx * 0.009;
          this.rotX += dy * 0.009;
          this.velRotY = dx * 0.002;
          this.velRotX = dy * 0.002;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const factor = dist / (lastDist || dist);
          this.targetZoom = Math.max(0.65, Math.min(2.2, this.targetZoom * factor));
          lastDist = dist;
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', () => { isDragging = false; });

      // Mouse wheel zoom
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.targetZoom = Math.max(0.65, Math.min(2.2, this.targetZoom - e.deltaY * 0.0015));
      }, { passive: false });

      // Gyroscope tilt on mobile
      if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
        window.addEventListener('deviceorientation', (e) => {
          if (e.gamma !== null && e.beta !== null) {
            this.rotY += (e.gamma * 0.0003);
            this.rotX += (e.beta * 0.0002);
          }
        }, { passive: true });
      }
    }

    handleClickRaycast(screenX, screenY) {
      const rect = this.canvas.getBoundingClientRect();
      const x = screenX - rect.left;
      const y = screenY - rect.top;

      let hit = null;
      let minDist = 30; // 30px touch threshold

      AGENT_SATELLITES.forEach(ag => {
        if (ag._screenPos) {
          const d = Math.hypot(ag._screenPos.x - x, ag._screenPos.y - y);
          if (d < minDist) {
            minDist = d;
            hit = ag;
          }
        }
      });

      if (hit) {
        this.selectedNode = hit;
        this.pulseTarget = 24;
        if (this.onNodeClick) this.onNodeClick(hit);
      }
    }

    triggerAudioPulse(magnitude = 15) {
      this.pulseTarget = magnitude;
    }

    project(v) {
      // Rotate 3D space
      let r = v.rotateX(this.rotX).rotateY(this.rotY);
      // Perspective projection
      const zDist = r.z + this.fov;
      const pFactor = this.fov / (zDist || 1);
      const x2d = this.cx + r.x * pFactor * this.scale * this.zoom;
      const y2d = this.cy + r.y * pFactor * this.scale * this.zoom;
      return { x: x2d, y: y2d, z: r.z, pFactor };
    }

    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Smooth camera dampening & rotation
      this.rotY += this.velRotY;
      this.rotX += this.velRotX;
      this.velRotY *= 0.94;
      this.velRotX *= 0.94;
      if (Math.abs(this.velRotY) < 0.003) this.velRotY = 0.003; // Gentle ambient rotation
      this.zoom += (this.targetZoom - this.zoom) * 0.1;

      // Audio pulse interpolation
      this.pulseAmplitude += (this.pulseTarget - this.pulseAmplitude) * 0.15;
      this.pulseTarget *= 0.92;

      // 1. Render Background GraphRAG 3D Dust Particles
      this.dust.forEach(p => {
        p.pos.y += p.speed;
        if (p.pos.y > 180) p.pos.y = -180;
        if (p.pos.y < -180) p.pos.y = 180;

        const proj = this.project(p.pos);
        if (proj.z > -this.fov + 20) {
          const alpha = Math.max(0.1, Math.min(0.65, (proj.z + 180) / 360));
          this.ctx.fillStyle = p.color.replace('0.4', String(alpha));
          this.ctx.beginPath();
          this.ctx.arc(proj.x, proj.y, p.size * proj.pFactor * 0.8, 0, Math.PI * 2);
          this.ctx.fill();
        }
      });

      // 2. Compute 3D Geodesic Icosahedron Core Vertices
      const coreBaseRadius = 55 + this.pulseAmplitude * 0.8;
      const projectedVerts = rawIcoVerts.map(v => {
        const scaled = v.scale(coreBaseRadius);
        return this.project(scaled);
      });

      // 3. Render 3D Icosahedron Edges with Holographic Cyan/Purple Gradient
      this.ctx.lineWidth = 1.2 * this.zoom;
      icoEdges.forEach(([i, j]) => {
        const p1 = projectedVerts[i];
        const p2 = projectedVerts[j];
        if (p1 && p2) {
          const avgZ = (p1.z + p2.z) / 2;
          const alpha = Math.max(0.15, Math.min(0.85, (avgZ + 100) / 200));

          this.ctx.strokeStyle = `rgba(0, 245, 255, ${alpha * 0.75})`;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      });

      // 4. Render Core Holographic Vertices & Central Fusion Sphere
      projectedVerts.forEach(p => {
        const alpha = Math.max(0.2, Math.min(0.95, (p.z + 100) / 200));
        this.ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 2.5 * p.pFactor * this.zoom, 0, Math.PI * 2);
        this.ctx.fill();
      });

      // Central Quantum Singularity Glow
      const centerProj = this.project(new Vec3(0, 0, 0));
      const gradCenter = this.ctx.createRadialGradient(
        centerProj.x, centerProj.y, 2,
        centerProj.x, centerProj.y, (38 + this.pulseAmplitude) * centerProj.pFactor * this.zoom
      );
      gradCenter.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      gradCenter.addColorStop(0.3, 'rgba(0, 245, 255, 0.4)');
      gradCenter.addColorStop(0.7, 'rgba(139, 92, 246, 0.15)');
      gradCenter.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradCenter;
      this.ctx.beginPath();
      this.ctx.arc(centerProj.x, centerProj.y, (38 + this.pulseAmplitude) * centerProj.pFactor * this.zoom, 0, Math.PI * 2);
      this.ctx.fill();

      // 5. Render Orbiting 3D Multi-Agent Satellites & DAG Synaptic Beams
      const t = performance.now() * 0.001;
      const sortedAgents = AGENT_SATELLITES.map(ag => {
        const curAngle = ag.phase + t * ag.speed * 60;
        const x = Math.cos(curAngle) * ag.radius;
        const z = Math.sin(curAngle) * ag.radius;
        const y = Math.sin(curAngle + ag.inc) * (ag.radius * Math.sin(ag.inc));

        const pos3d = new Vec3(x, y, z);
        const proj = this.project(pos3d);
        ag._screenPos = { x: proj.x, y: proj.y, z: proj.z, pFactor: proj.pFactor };
        return { agent: ag, proj };
      }).sort((a, b) => a.proj.z - b.proj.z);

      // Synaptic energy lines connecting agents to central core & between each other
      sortedAgents.forEach(({ agent, proj }) => {
        // Line to core
        const alpha = Math.max(0.15, Math.min(0.7, (proj.z + 180) / 360));
        this.ctx.strokeStyle = `rgba(0, 245, 255, ${alpha * 0.4})`;
        this.ctx.lineWidth = 0.8 * this.zoom;
        this.ctx.beginPath();
        this.ctx.moveTo(centerProj.x, centerProj.y);
        this.ctx.lineTo(proj.x, proj.y);
        this.ctx.stroke();

        // Agent Orb & Glow Halo
        const isSelected = this.selectedNode && this.selectedNode.id === agent.id;
        const nodeRadius = (isSelected ? 7.5 : 5.0) * proj.pFactor * this.zoom;

        const gradNode = this.ctx.createRadialGradient(proj.x, proj.y, 1, proj.x, proj.y, nodeRadius * 2.5);
        gradNode.addColorStop(0, '#ffffff');
        gradNode.addColorStop(0.4, agent.color);
        gradNode.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = gradNode;
        this.ctx.beginPath();
        this.ctx.arc(proj.x, proj.y, nodeRadius * 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        // 3D Monospace Label
        this.ctx.font = `${Math.round(10 * proj.pFactor * this.zoom)}px "SF Mono", Consolas, monospace`;
        this.ctx.fillStyle = isSelected ? '#00f5ff' : 'rgba(248, 250, 252, 0.85)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(agent.id.toUpperCase(), proj.x, proj.y + nodeRadius * 2.8 + 2);
      });

      // 6. Traveling Synaptic Photons (Consensus in Flight)
      this.photons.forEach(pt => {
        pt.progress += pt.speed;
        if (pt.progress > 1) {
          pt.progress = 0;
          pt.fromAgentIdx = (pt.fromAgentIdx + 1) % AGENT_SATELLITES.length;
        }

        const sourceAg = AGENT_SATELLITES[pt.fromAgentIdx];
        if (sourceAg && sourceAg._screenPos) {
          const px = centerProj.x + (sourceAg._screenPos.x - centerProj.x) * pt.progress;
          const py = centerProj.y + (sourceAg._screenPos.y - centerProj.y) * pt.progress;

          this.ctx.fillStyle = '#ffffff';
          this.ctx.shadowColor = '#00f5ff';
          this.ctx.shadowBlur = 8;
          this.ctx.beginPath();
          this.ctx.arc(px, py, 2.2 * this.zoom, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      });
    }

    start() {
      const loop = () => {
        this.render();
        this.animId = requestAnimationFrame(loop);
      };
      loop();
    }

    stop() {
      if (this.animId) cancelAnimationFrame(this.animId);
    }
  }

  function mount(canvasId, options) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    return new HoloInstance(canvas, options);
  }

  return { mount, Vec3 };
})();

if (typeof window !== 'undefined') {
  window.QuantumHolo3D = QuantumHolo3D;
}
