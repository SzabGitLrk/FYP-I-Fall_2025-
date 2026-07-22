import { useEffect, useRef } from "react";

const SPEED = 1.8;
const PERIOD = 230;
const HEAD_T = 0.70;

function ecgY(x, period) {
  const t = ((x % period) / period + 1) % 1;
  if (t < 0.30) return Math.sin((t / 0.30) * Math.PI) * 10;
  if (t < 0.38) return -Math.sin(((t - 0.30) / 0.08) * Math.PI) * 7;
  if (t < 0.46) return -Math.sin(((t - 0.38) / 0.08) * Math.PI * 0.5) * 60;
  if (t < 0.52) return -60 + Math.sin(((t - 0.46) / 0.06) * Math.PI * 0.5) * 85;
  if (t < 0.57) return 25 - Math.sin(((t - 0.52) / 0.05) * Math.PI) * 25;
  if (t < 0.70) return Math.sin(((t - 0.57) / 0.13) * Math.PI) * 16;
  return 0;
}

export default function ECGLoader() {
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 130 * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const H = 130;
      ctx.clearRect(0, 0, w, H);

      const mid = H / 2 + 6;
      const pts = Math.floor(w);
      const offset = offsetRef.current;

      const headX = Math.floor(pts * HEAD_T);
      const headY = mid + ecgY(headX + offset, PERIOD);

      // Waveform gradient
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(0,168,176,0)");
      grad.addColorStop(HEAD_T * 0.3, "rgba(94,188,184,0.2)");
      grad.addColorStop(HEAD_T * 0.7, "#5EBCB8");
      grad.addColorStop(HEAD_T, "#00A8B0");
      grad.addColorStop(Math.min(HEAD_T + 0.01, 1), "rgba(0,168,176,0)");
      grad.addColorStop(1, "rgba(0,168,176,0)");

      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const y = mid + ecgY(i + offset, PERIOD);
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      // Fill gradient beneath wave
      const fillGrad = ctx.createLinearGradient(0, 0, w, 0);
      fillGrad.addColorStop(0, "rgba(0,168,176,0)");
      fillGrad.addColorStop(HEAD_T * 0.5, "rgba(0,168,176,0.06)");
      fillGrad.addColorStop(HEAD_T, "rgba(0,168,176,0.12)");
      fillGrad.addColorStop(Math.min(HEAD_T + 0.01, 1), "rgba(0,168,176,0)");
      fillGrad.addColorStop(1, "rgba(0,168,176,0)");

      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const y = mid + ecgY(i + offset, PERIOD);
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.lineTo(pts, mid);
      ctx.lineTo(0, mid);
      ctx.closePath();
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Head dot (white with teal border)
      ctx.beginPath();
      ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = "#00A8B0";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulsing ring around head
      const ringR = 3.5 + 5 + Math.sin(Date.now() / 400) * 3;
      const ringAlpha = 0.18 + Math.sin(Date.now() / 400) * 0.1;
      ctx.beginPath();
      ctx.arc(headX, headY, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,168,176,${ringAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      offsetRef.current += SPEED;
      if (offsetRef.current > PERIOD * 100) offsetRef.current = 0;

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      cancelAnimationFrame(rafRef.current);
      resize();
      draw();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="w-full flex items-center justify-center py-12">
      {/* Card */}
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden relative shadow-xl border border-teal-100">

        {/* Grid background */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,168,176,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,168,176,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-8 py-12">

          {/* Canvas */}
          <div className="w-full">
            <canvas
              ref={canvasRef}
              style={{ display: "block", width: "100%", height: "130px" }}
            />
          </div>

          {/* Status row */}
          <div className="mt-7 flex items-center gap-2.5">
            {/* Pulse dot */}
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "#00A8B0",
                animation: "pulseDot 1.4s ease-in-out infinite",
              }}
            />
            <span
              className="text-sm tracking-widest"
              style={{ color: "#4A5565", fontFamily: "sans-serif" }}
            >
              Analyzing report&hellip;
            </span>
          </div>
        </div>
      </div>

      {/* Keyframe injection */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.65); }
        }
      `}</style>
    </div>
  );
}
