"use client";

import { useEffect, useRef } from "react";

interface Node3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  type: "donor" | "shelter" | "driver" | "particle";
  size: number;
  color: string;
  speed: number;
  angle: number;
  radius: number;
}

interface MovingPulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

export function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates for 3D tilt
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.2;
    let targetRotY = 0;
    let currentRotX = 0.2;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 2;
      mouseY = y * 2;
      targetRotY = mouseX * 0.45;
      targetRotX = 0.25 - mouseY * 0.35;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Generate 3D nodes (donors, shelters, drivers, and particles)
    const nodes: Node3D[] = [];
    const count = 42;

    for (let i = 0; i < count; i++) {
      const type = i % 4 === 0 ? "donor" : i % 4 === 1 ? "shelter" : i % 4 === 2 ? "driver" : "particle";
      const radius = 180 + Math.random() * 320;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const yOffset = (Math.random() - 0.5) * 260;
      
      const color =
        type === "donor"
          ? "#D42B2B" // brand-red
          : type === "shelter"
          ? "#0A0A0A" // brand-black
          : type === "driver"
          ? "#16A34A" // emerald green
          : "#71717A"; // zinc

      nodes.push({
        x: Math.cos(angle) * radius,
        y: yOffset,
        z: Math.sin(angle) * radius,
        baseX: Math.cos(angle) * radius,
        baseY: yOffset,
        baseZ: Math.sin(angle) * radius,
        type,
        size: type === "particle" ? 2.5 : 7,
        color,
        speed: (Math.random() * 0.004 + 0.002) * (i % 2 === 0 ? 1 : -1),
        angle,
        radius,
      });
    }

    // Moving signal pulses between active nodes
    const pulses: MovingPulse[] = [
      { fromNode: 0, toNode: 1, progress: 0, speed: 0.012, color: "#D42B2B" },
      { fromNode: 4, toNode: 5, progress: 0.3, speed: 0.015, color: "#16A34A" },
      { fromNode: 8, toNode: 9, progress: 0.7, speed: 0.009, color: "#D42B2B" },
      { fromNode: 12, toNode: 13, progress: 0.5, speed: 0.014, color: "#0A0A0A" },
    ];

    let t = 0;

    const render = () => {
      t += 0.01;
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const fov = 480;
      const cx = width / 2;
      const cy = height / 2;

      // Rotate nodes around Y and X axis
      const projected = nodes.map((node) => {
        node.angle += node.speed;
        const orbitX = Math.cos(node.angle) * node.radius;
        const orbitZ = Math.sin(node.angle) * node.radius;
        const floatY = node.baseY + Math.sin(t * 2 + node.angle) * 15;

        // Apply Y rotation
        const cosY = Math.cos(currentRotY + t * 0.1);
        const sinY = Math.sin(currentRotY + t * 0.1);
        const x1 = orbitX * cosY - orbitZ * sinY;
        const z1 = orbitZ * cosY + orbitX * sinY;

        // Apply X rotation (tilt)
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);
        const y2 = floatY * cosX - z1 * sinX;
        const z2 = z1 * cosX + floatY * sinX + 600; // push depth away

        const scale = fov / (fov + z2);
        const px = cx + x1 * scale * 1.8;
        const py = cy + y2 * scale * 1.8;

        return { ...node, px, py, scale, z: z2 };
      });

      // Sort by depth (painters algorithm)
      projected.sort((a, b) => b.z - a.z);

      // Draw 3D Ground Logistics Grid
      const gridSize = 400;
      const gridSteps = 10;
      const step = gridSize / gridSteps;

      ctx.save();
      ctx.lineWidth = 1;

      for (let i = -gridSteps; i <= gridSteps; i += 2) {
        // Horizontal line
        const p1 = project3D(-gridSize, 140, i * step, cx, cy, fov, currentRotX, currentRotY, t);
        const p2 = project3D(gridSize, 140, i * step, cx, cy, fov, currentRotX, currentRotY, t);

        if (p1 && p2) {
          ctx.strokeStyle = "rgba(10, 10, 10, 0.05)";
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Vertical line
        const p3 = project3D(i * step, 140, -gridSize, cx, cy, fov, currentRotX, currentRotY, t);
        const p4 = project3D(i * step, 140, gridSize, cx, cy, fov, currentRotX, currentRotY, t);

        if (p3 && p4) {
          ctx.strokeStyle = "rgba(10, 10, 10, 0.05)";
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Draw connection vectors between close nodes
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dist = Math.hypot(a.px - b.px, a.py - b.py);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.25;
            ctx.strokeStyle = `rgba(212, 43, 43, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }

      // Draw moving rescue pulses
      pulses.forEach((pulse) => {
        pulse.progress += pulse.speed;
        if (pulse.progress > 1) pulse.progress = 0;

        const a = projected[pulse.fromNode % projected.length];
        const b = projected[pulse.toNode % projected.length];
        if (!a || !b) return;

        const curX = a.px + (b.px - a.px) * pulse.progress;
        const curY = a.py + (b.py - a.py) * pulse.progress;
        const curSize = 4 * a.scale;

        ctx.fillStyle = pulse.color;
        ctx.beginPath();
        ctx.arc(curX, curY, Math.max(curSize, 2), 0, Math.PI * 2);
        ctx.fill();

        // Glow ring around moving pulse
        ctx.strokeStyle = pulse.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(curX, curY, Math.max(curSize * 2.2, 5), 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw 3D Isometric Crates & Nodes
      projected.forEach((p) => {
        const r = Math.max(p.size * p.scale, 2);

        if (p.type === "donor" || p.type === "shelter") {
          // Draw 3D Isometric Cube/Crate
          draw3DCube(ctx, p.px, p.py, r * 2.2, p.type === "donor" ? "#D42B2B" : "#0A0A0A");
        } else if (p.type === "driver") {
          // Draw Vehicle Marker with pulse halo
          ctx.fillStyle = "#16A34A";
          ctx.beginPath();
          ctx.arc(p.px, p.py, r * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(22, 163, 74, 0.4)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.px, p.py, r * 3, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Ambient Particle
          ctx.fillStyle = "rgba(10, 10, 10, 0.25)";
          ctx.beginPath();
          ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-80"
        style={{ pointerEvents: "auto" }}
      />
    </div>
  );
}

// 3D projection helper
function project3D(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  fov: number,
  rotX: number,
  rotY: number,
  t: number
) {
  const cosY = Math.cos(rotY + t * 0.1);
  const sinY = Math.sin(rotY + t * 0.1);
  const x1 = x * cosY - z * sinY;
  const z1 = z * cosY + x * sinY;

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = z1 * cosX + y * sinX + 600;

  if (z2 <= -fov) return null;
  const scale = fov / (fov + z2);
  return {
    x: cx + x1 * scale * 1.8,
    y: cy + y2 * scale * 1.8,
  };
}

// Draws a 3D isometric cube onto canvas
function draw3DCube(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const h = size;
  const w = size * 0.866;

  // Top Face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx + w, cy - h * 0.5);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx - w, cy - h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#0A0A0A";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Left Face (darker shade)
  ctx.fillStyle = color === "#D42B2B" ? "#B91C1C" : "#171717";
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h * 0.5);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx - w, cy + h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Face (medium shade)
  ctx.fillStyle = color === "#D42B2B" ? "#DC2626" : "#262626";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + w, cy - h * 0.5);
  ctx.lineTo(cx + w, cy + h * 0.5);
  ctx.lineTo(cx, cy + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
