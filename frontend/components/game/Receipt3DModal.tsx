"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { PrinterIcon, Cancel01Icon } from "hugeicons-react";
import type { Basket, Reward } from "@/features/gameplay/types";
import { printSaleReceipt } from "./SaleReceipt";

type Receipt3DModalProps = {
  shopName: string;
  customerName: string;
  basket: Basket;
  reward: Reward | null;
  onClose: () => void;
};

const doodles = [
  "/illustrations/mario.PNG",
  "/mascots/milo.PNG",
  "/illustrations/stitch.PNG",
  "/illustrations/kirby.PNG",
  "/illustrations/jack.PNG"
];

export function Receipt3DModal({
  shopName,
  customerName,
  basket,
  reward,
  onClose,
}: Receipt3DModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // References to keep pointer listeners simple
  const pointerRef = useRef({ x: 0, y: 0, isDown: false, grabbedIndex: -1, grabDepth: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Request WebGL with alpha support for transparency
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // --- 1. Texture Generation (2D Canvas with dynamic height) ---
    const baseHeight = 620; // header, dividers, rewards, and footers space
    const itemHeight = basket.lines.length * 42;
    const H = Math.min(1024, baseHeight + itemHeight);
    const textureHeight = H * 2;

    const texCanvas = document.createElement("canvas");
    texCanvas.width = 1024;
    texCanvas.height = textureHeight;
    const ctx = texCanvas.getContext("2d");
    if (ctx) {
      ctx.scale(2, 2);
      const W = 512;

      // Paper background (creamy receipt paper look)
      ctx.fillStyle = "#faf9f5";
      ctx.fillRect(0, 0, W, H);

      // Text settings
      ctx.fillStyle = "#1e1e1e";

      // Header
      ctx.font = "bold 34px monospace";
      ctx.textAlign = "center";
      ctx.fillText(shopName.toUpperCase(), W / 2, 80);

      ctx.font = "20px monospace";
      ctx.fillText("Smart Duka Checkout", W / 2, 125);
      ctx.fillText(`Customer: ${customerName}`, W / 2, 160);

      // Meta info
      ctx.font = "17px monospace";
      ctx.textAlign = "left";
      const saleTime = new Intl.DateTimeFormat("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());
      ctx.fillText(`Date: ${saleTime}`, 40, 220);
      ctx.fillText(`Order: #${Math.floor(1000 + Math.random() * 9000)}`, 40, 255);

      // Dashed divider
      ctx.textAlign = "center";
      ctx.fillText("- - - - - - - - - - - - - - - - - -", W / 2, 305);

      // Items
      let startY = 355;
      const lineH = 42;
      basket.lines.forEach((line) => {
        ctx.font = "17px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`${line.quantity}x ${line.item.name}`, 40, startY);
        ctx.textAlign = "right";
        ctx.fillText(`KES ${line.line_total_kes}`, W - 40, startY);
        startY += lineH;
      });

      // Dashed divider
      ctx.font = "17px monospace";
      ctx.textAlign = "center";
      ctx.fillText("- - - - - - - - - - - - - - - - - -", W / 2, startY + 10);

      // Total
      ctx.font = "bold 23px monospace";
      ctx.textAlign = "left";
      ctx.fillText("TOTAL", 40, startY + 55);
      ctx.textAlign = "right";
      ctx.fillText(`KES ${basket.total_kes}`, W - 40, startY + 55);

      // Rewards
      if (reward) {
        ctx.font = "bold 17px monospace";
        ctx.fillStyle = "#0b6b45";
        ctx.textAlign = "center";
        ctx.fillText(`+${reward.coins} coins   +${reward.xp} XP   +${reward.stars} stars`, W / 2, startY + 110);
      }

      // Footer (dynamically offset from dynamic H height)
      ctx.fillStyle = "#555";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Thank you for learning & growing!", W / 2, H - 90);
      ctx.font = "14px monospace";
      ctx.fillText("Smart Duka Checkout Simulation", W / 2, H - 55);
    }

    // --- 2. WebGL Shaders & Program ---
    const vsSource = `
      attribute vec3 a_pos;
      attribute vec3 a_norm;
      attribute vec2 a_uv;
      uniform mat4 u_proj;
      uniform mat4 u_view;
      varying vec3 v_norm;
      varying vec2 v_uv;
      void main() {
        v_norm = a_norm;
        v_uv = a_uv;
        gl_Position = u_proj * u_view * vec4(a_pos, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec3 v_norm;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      void main() {
        vec3 norm = normalize(v_norm);
        if (!gl_FrontFacing) norm = -norm;
        
        vec3 lightDir1 = normalize(vec3(0.4, 0.8, 0.6));
        vec3 lightDir2 = normalize(vec3(-0.5, -0.2, 0.8));
        
        float diff1 = max(dot(norm, lightDir1), 0.0);
        float diff2 = max(dot(norm, lightDir2), 0.0);
        float ambient = 0.65;
        
        vec4 texColor = texture2D(u_tex, v_uv);
        vec3 finalColor = texColor.rgb * (ambient + diff1 * 0.35 + diff2 * 0.15);
        
        gl_FragColor = vec4(finalColor, texColor.a);
      }
    `;

    const createShader = (type: number, source: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const aPos = gl.getAttribLocation(program, "a_pos");
    const aNorm = gl.getAttribLocation(program, "a_norm");
    const aUv = gl.getAttribLocation(program, "a_uv");
    const uProj = gl.getUniformLocation(program, "u_proj");
    const uView = gl.getUniformLocation(program, "u_view");

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // --- 3. Physics Simulation Setup with dynamic aspect ratio height ---
    const numX = 22;
    const numY = 44;
    const numParticles = numX * numY;
    const width = 2.8;
    const height = width * (H / 512); // Shortened receipt length based on item count!

    type Particle = { x: number; y: number; z: number; ox: number; oy: number; oz: number };
    const particles: Particle[] = [];
    const posData = new Float32Array(numParticles * 3);
    const normalData = new Float32Array(numParticles * 3);
    const uvData = new Float32Array(numParticles * 2);

    for (let y = 0; y < numY; y++) {
      for (let x = 0; x < numX; x++) {
        const px = (x / (numX - 1) - 0.5) * width;
        const py = -(y / (numY - 1)) * height;
        const pz = 0;

        const i = y * numX + x;
        particles.push({ x: px, y: py, z: pz, ox: px, oy: py, oz: pz });

        uvData[i * 2] = x / (numX - 1);
        uvData[i * 2 + 1] = y / (numY - 1);
      }
    }

    type Constraint = { p1: number; p2: number; rest: number };
    const constraints: Constraint[] = [];
    const addConstraint = (i1: number, i2: number) => {
      const dx = particles[i2].x - particles[i1].x;
      const dy = particles[i2].y - particles[i1].y;
      const dz = particles[i2].z - particles[i1].z;
      constraints.push({ p1: i1, p2: i2, rest: Math.sqrt(dx * dx + dy * dy + dz * dz) });
    };

    for (let y = 0; y < numY; y++) {
      for (let x = 0; x < numX; x++) {
        const i = y * numX + x;
        // Structural
        if (x < numX - 1) addConstraint(i, i + 1);
        if (y < numY - 1) addConstraint(i, i + numX);
        // Shear
        if (x < numX - 1 && y < numY - 1) {
          addConstraint(i, i + numX + 1);
          addConstraint(i + 1, i + numX);
        }
        // Bending
        if (x < numX - 2) addConstraint(i, i + 2);
        if (y < numY - 2) addConstraint(i, i + numX * 2);
      }
    }

    const indices: number[] = [];
    for (let y = 0; y < numY - 1; y++) {
      for (let x = 0; x < numX - 1; x++) {
        const i = y * numX + x;
        indices.push(i, i + 1, i + numX);
        indices.push(i + 1, i + numX + 1, i + numX);
      }
    }

    const posBuf = gl.createBuffer();
    const normBuf = gl.createBuffer();

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    gl.enable(gl.DEPTH_TEST);

    // Camera setup - keep top row aligned with dispenser slot by keeping Y translation constant
    const camPos = { x: 0, y: -2.0, z: 7.6 };
    const fov = (43 * Math.PI) / 180;
    let aspect = 1;

    // View & Projection helper matrices
    const projMatrix = new Float32Array(16);
    const viewMatrix = new Float32Array(16);

    const setPerspective = (
      out: Float32Array,
      fovy: number,
      asp: number,
      near: number,
      far: number
    ) => {
      const f = 1.0 / Math.tan(fovy / 2);
      const nf = 1 / (near - far);
      out.fill(0);
      out[0] = f / asp;
      out[5] = f;
      out[10] = (far + near) * nf;
      out[11] = -1;
      out[14] = 2 * far * near * nf;
    };

    const setTranslation = (out: Float32Array, x: number, y: number, z: number) => {
      out.fill(0);
      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      out[12] = x;
      out[13] = y;
      out[14] = z;
    };

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = (rect?.width || window.innerWidth) * dpr;
      const h = (rect?.height || window.innerHeight) * dpr;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      aspect = w / h;
    };

    resize();
    window.addEventListener("resize", resize);

    // --- 4. Interactivity Ray Casting ---
    const getRay = (x: number, y: number) => {
      const tanFov = Math.tan(fov / 2);
      const dx = x * aspect * tanFov;
      const dy = y * tanFov;
      const dz = -1;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return {
        origin: { x: camPos.x, y: camPos.y, z: camPos.z },
        dir: { x: dx / len, y: dy / len, z: dz / len },
      };
    };

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      pointerRef.current.x = (localX / rect.width) * 2 - 1;
      pointerRef.current.y = -(localY / rect.height) * 2 + 1;
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerRef.current.isDown = true;
      updatePointer(e.clientX, e.clientY);

      const ray = getRay(pointerRef.current.x, pointerRef.current.y);
      let minDist = Infinity;
      let bestIdx = -1;

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        const vx = p.x - ray.origin.x;
        const vy = p.y - ray.origin.y;
        const vz = p.z - ray.origin.z;

        const t = vx * ray.dir.x + vy * ray.dir.y + vz * ray.dir.z;
        const px = ray.origin.x + ray.dir.x * t;
        const py = ray.origin.y + ray.dir.y * t;
        const pz = ray.origin.z + ray.dir.z * t;

        const dx = p.x - px;
        const dy = p.y - py;
        const dz = p.z - pz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < minDist && dist < 0.9) {
          minDist = dist;
          bestIdx = i;
          pointerRef.current.grabDepth = t;
        }
      }

      if (bestIdx !== -1) {
        pointerRef.current.grabbedIndex = bestIdx;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
      const grab = pointerRef.current;
      if (grab.grabbedIndex !== -1) {
        const ray = getRay(grab.x, grab.y);
        const p = particles[grab.grabbedIndex];
        p.x = ray.origin.x + ray.dir.x * grab.grabDepth;
        p.y = ray.origin.y + ray.dir.y * grab.grabDepth;
        p.z = ray.origin.z + ray.dir.z * grab.grabDepth;
        p.ox = p.x;
        p.oy = p.y;
        p.oz = p.z;
      }
    };

    const handlePointerUp = () => {
      pointerRef.current.isDown = false;
      pointerRef.current.grabbedIndex = -1;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    // --- 5. Main Render Loop ---
    let time = 0;
    const loop = () => {
      time += 0.016;

      // Wind details
      const windX = Math.sin(time * 1.6) * 0.0016;
      const windZ = Math.cos(time * 1.2) * 0.0016;

      // Integration & Gravity
      for (let i = 0; i < numParticles; i++) {
        // Pinned top row
        if (i < numX || i === pointerRef.current.grabbedIndex) continue;

        const p = particles[i];
        const vx = (p.x - p.ox) * 0.985;
        const vy = (p.y - p.oy) * 0.985;
        const vz = (p.z - p.oz) * 0.985;

        p.ox = p.x;
        p.oy = p.y;
        p.oz = p.z;

        const windFactor = p.y / -height; // more wind sway at the bottom
        p.x += vx + windX * windFactor;
        p.y += vy - 0.0068; // Gravity pulls downwards
        p.z += vz + windZ * windFactor;
      }

      // Constraints relaxation
      const iterations = 14;
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < constraints.length; i++) {
          const c = constraints[i];
          const p1 = particles[c.p1];
          const p2 = particles[c.p2];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dz = p2.z - p1.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;

          const w1 = c.p1 < numX || c.p1 === pointerRef.current.grabbedIndex ? 0 : 1;
          const w2 = c.p2 < numX || c.p2 === pointerRef.current.grabbedIndex ? 0 : 1;
          const wSum = w1 + w2;

          if (wSum > 0) {
            const diff = (dist - c.rest) / (dist * wSum);
            const offsetX = dx * diff;
            const offsetY = dy * diff;
            const offsetZ = dz * diff;

            if (w1) {
              p1.x += offsetX;
              p1.y += offsetY;
              p1.z += offsetZ;
            }
            if (w2) {
              p2.x -= offsetX;
              p2.y -= offsetY;
              p2.z -= offsetZ;
            }
          }
        }
      }

      // Update positions buffer & normals
      normalData.fill(0);
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        posData[i * 3] = p.x;
        posData[i * 3 + 1] = p.y;
        posData[i * 3 + 2] = p.z;
      }

      for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];

        const v1x = posData[i1 * 3];
        const v1y = posData[i1 * 3 + 1];
        const v1z = posData[i1 * 3 + 2];
        const v2x = posData[i2 * 3];
        const v2y = posData[i2 * 3 + 1];
        const v2z = posData[i2 * 3 + 2];
        const v3x = posData[i3 * 3];
        const v3y = posData[i3 * 3 + 1];
        const v3z = posData[i3 * 3 + 2];

        const dx1 = v2x - v1x;
        const dy1 = v2y - v1y;
        const dz1 = v2z - v1z;
        const dx2 = v3x - v1x;
        const dy2 = v3y - v1y;
        const dz2 = v3z - v1z;

        const nx = dy1 * dz2 - dz1 * dy2;
        const ny = dz1 * dx2 - dx1 * dz2;
        const nz = dx1 * dy2 - dy1 * dx2;

        normalData[i1 * 3] += nx;
        normalData[i1 * 3 + 1] += ny;
        normalData[i1 * 3 + 2] += nz;
        normalData[i2 * 3] += nx;
        normalData[i2 * 3 + 1] += ny;
        normalData[i2 * 3 + 2] += nz;
        normalData[i3 * 3] += nx;
        normalData[i3 * 3 + 1] += ny;
        normalData[i3 * 3 + 2] += nz;
      }

      // Clear & Draw (Use transparent background to show the container doodles underneath!)
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      setPerspective(projMatrix, fov, aspect, 0.1, 100.0);
      setTranslation(viewMatrix, -camPos.x, -camPos.y, -camPos.z);

      gl.uniformMatrix4fv(uProj, false, projMatrix);
      gl.uniformMatrix4fv(uView, false, viewMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aNorm);
      gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [shopName, customerName, basket, reward]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-md p-4"
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-md h-[70vh] aspect-[3/4.2] rounded-[24px] overflow-hidden border border-[#d2d0c6] dark:border-zinc-800/85 bg-[#deddd5] dark:bg-[#111112] shadow-2xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {/* Repeated Low-opacity Mascot Doodle Grid */}
        <div className="absolute inset-0 grid grid-cols-4 gap-6 p-6 opacity-[0.06] dark:opacity-[0.03] pointer-events-none select-none overflow-hidden z-0">
          {Array.from({ length: 24 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-center aspect-square">
              <img
                src={doodles[idx % doodles.length]}
                alt="mascot doodle"
                className="w-12 h-12 object-contain grayscale"
              />
            </div>
          ))}
        </div>

        {/* 3D WebGL Canvas Layer */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />
        
        {/* Receipt Slot Dispenser (Aligns precisely with screenY 16.5% top row of paper) */}
        <div className="absolute top-[16.5%] left-1/2 -translate-x-1/2 w-[71%] h-[18px] bg-black dark:bg-[#050505] rounded-full border border-[#cac8be] dark:border-zinc-800 shadow-inner z-10 flex items-center justify-center">
          <div className="w-[98%] h-[6px] bg-zinc-950 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex size-10 items-center justify-center rounded-full bg-[#cdcbc0]/85 text-zinc-700 dark:bg-black/40 dark:text-white backdrop-blur-sm border border-[#bab8ae]/40 dark:border-white/10 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Close receipt"
        >
          <Cancel01Icon size={18} />
        </button>

        {/* Hover Hint Info */}
        <div className="absolute bottom-6 z-20 pointer-events-none text-center bg-[#cdcbc0]/75 dark:bg-black/40 px-4 py-2 rounded-full border border-[#bab8ae]/30 dark:border-white/5 backdrop-blur-sm">
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-zinc-700 dark:text-zinc-300">
            Grab and drag the receipt to swing it!
          </p>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <button
          type="button"
          onClick={() => printSaleReceipt({ shopName, customerName, basket, reward })}
          className="inline-flex items-center gap-2 rounded-full bg-[#30D158] hover:bg-[#28b548] px-7 py-3.5 font-bold text-black shadow-lg transition-transform hover:scale-[1.03] active:scale-100"
        >
          <PrinterIcon size={20} className="stroke-[2.5]" />
          Print Physical Receipt
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#cdcbc0] dark:border-white/20 bg-[#deddd5]/60 text-zinc-700 dark:bg-white/10 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/15 px-7 py-3.5 font-bold transition-transform hover:scale-[1.03]"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
