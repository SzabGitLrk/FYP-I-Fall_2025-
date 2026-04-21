import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, Fish, AlertCircle, CheckCircle, Loader,
  RefreshCw, BarChart3, MapPin, Lightbulb, Zap, BookOpen,
  RotateCcw, ChevronDown, Eye, Database, ArrowRight, Shield, Share2
} from 'lucide-react';
import { useFishDetector } from './hooks/useFishDetector';
import { useDetectionHistory } from './hooks/useDetectionHistory';
import { getSpeciesByModelLabel, SPECIES_DATA } from './utils/speciesData';
import { downloadShareCard } from './utils/shareCard';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — one place to change colours
// ─────────────────────────────────────────────────────────────────────────────
// Card bg:   #0d1f35  (dark navy, clearly visible on page bg)
// Card border: rgba(56,189,248,0.18)
// Heading:   #ffffff
// Body:      #94a3b8  (slate-400 — readable on dark)
// Accent:    #2dd4bf  (teal-400)
// Accent2:   #38bdf8  (sky-400)

const CARD = {
  base: 'rounded-2xl border',
  bg:   'bg-[#0d1f35]',
  border: 'border-sky-400/20',
};

const STAGES = [
  { label: 'Loading image',           pct: 20 },
  { label: 'Preprocessing pixels',    pct: 40 },
  { label: 'Running neural network',  pct: 70 },
  { label: 'Analysing predictions',   pct: 90 },
  { label: 'Complete',                pct: 100 },
];

const TICKER = [
  '🦈 Shark','🐬 Dolphin','🐋 Whale','🐢 Sea Turtle',
  '🪼 Jellyfish','🦀 Crab','🦑 Octopus','🐠 Seahorse','⭐ Starfish','🌊 Sea Ray',
];

const EMOJIS = {
  'Crab':'🦀','Dolphin':'🐬','Jellyfish':'🪼','Octopus':'🦑',
  'Sea Ray':'🌊','Seahorse':'🐠','Shark':'🦈','Starfish':'⭐','Sea Turtle':'🐢','Whale':'🐋',
};

const CAT_STYLE = {
  shark:       { dot:'bg-blue-400',   badge:'bg-blue-400/15 text-blue-300 border-blue-400/30' },
  fish:        { dot:'bg-teal-400',   badge:'bg-teal-400/15 text-teal-300 border-teal-400/30' },
  invertebrate:{ dot:'bg-purple-400', badge:'bg-purple-400/15 text-purple-300 border-purple-400/30' },
  mammal:      { dot:'bg-cyan-400',   badge:'bg-cyan-400/15 text-cyan-300 border-cyan-400/30' },
  reptile:     { dot:'bg-green-400',  badge:'bg-green-400/15 text-green-300 border-green-400/30' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────────────────────
function Bubbles({ count = 14 }) {
  const list = Array.from({ length: count }, (_, i) => ({
    id: i, size: 5 + Math.random() * 16,
    left: Math.random() * 100, delay: Math.random() * 9, dur: 8 + Math.random() * 8,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {list.map(b => (
        <div key={b.id} className="bubble" style={{
          width: b.size, height: b.size, left: `${b.left}%`, bottom: -20,
          animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`,
        }} />
      ))}
    </div>
  );
}

function Counter({ to, suffix = '', ms = 1400 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let n = 0; const step = to / (ms / 16);
    const t = setInterval(() => { n = Math.min(n + step, to); setV(Math.floor(n)); if (n >= to) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [to, ms]);
  return <>{v.toLocaleString()}{suffix}</>;
}

function Ticker() {
  const [i, setI] = useState(0); const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setShow(false);
      setTimeout(() => { setI(x => (x + 1) % TICKER.length); setShow(true); }, 280);
    }, 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-bold text-teal-300 transition-all duration-300 inline-block"
      style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(-6px)' }}>
      {TICKER[i]}
    </span>
  );
}

function confGrad(p) {
  if (p >= 75) return 'from-teal-400 to-emerald-400';
  if (p >= 50) return 'from-amber-400 to-teal-400';
  return 'from-rose-400 to-amber-400';
}

function Bar({ label, value, delay = 0, hi = false }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 80 + delay); return () => clearTimeout(t); }, [value, delay]);
  return (
    <div className={`rounded-xl p-3 ${hi ? 'bg-teal-400/10 border border-teal-400/25' : 'bg-slate-800/60'}`}>
      <div className="flex justify-between mb-1.5">
        <span className={`text-sm font-medium ${hi ? 'text-white' : 'text-slate-300'}`}>{label}</span>
        <span className={`text-sm font-bold tabular-nums ${hi ? 'text-teal-300' : 'text-slate-400'}`}>{value}%</span>
      </div>
      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${confGrad(value)} transition-all duration-700 ease-out`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

function StageBar({ stage }) {
  const cur = STAGES[stage] || STAGES[0];
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(cur.pct), 40); return () => clearTimeout(t); }, [cur.pct]);
  return (
    <div className="w-full space-y-2.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{cur.label}…</span><span className="tabular-nums">{p}%</span>
      </div>
      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-teal-400 via-sky-400 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${p}%` }} />
      </div>
      <div className="flex justify-between px-0.5">
        {STAGES.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= stage ? 'bg-teal-400 scale-125' : 'bg-slate-700'}`} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Species info panel
// ─────────────────────────────────────────────────────────────────────────────
function SpeciesPanel({ name }) {
  const d = getSpeciesByModelLabel(name);
  if (!d) return null;
  const STATUS = {
    'Endangered':    'bg-rose-400/15 text-rose-300 border-rose-400/30',
    'Vulnerable':    'bg-amber-400/15 text-amber-300 border-amber-400/30',
    'Least Concern': 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  };
  const sc = STATUS[d.conservationStatus] || 'bg-sky-400/15 text-sky-300 border-sky-400/30';
  return (
    <div className="rounded-xl overflow-hidden border border-sky-400/15 animate-fadeIn">
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(90deg,#0a2a3a,#0a1f35)' }}>
        <div>
          <p className="text-white font-bold text-sm">{d.commonName}</p>
          <p className="text-slate-400 text-xs italic">{d.scientificName}</p>
        </div>
        {d.conservationStatus && (
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${sc}`}>{d.conservationStatus}</span>
        )}
      </div>
      <div className="bg-slate-800/50 p-4 space-y-3">
        <div className="flex gap-2.5">
          <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 text-xs leading-relaxed">{d.habitat}</p>
        </div>
        <div className="flex gap-2.5">
          <BookOpen className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 text-xs leading-relaxed">{d.description}</p>
        </div>
        {d.funFacts?.[0] && (
          <div className="flex gap-2.5 bg-amber-400/8 rounded-lg p-3 border border-amber-400/20">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-100 text-xs leading-relaxed">{d.funFacts[0]}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────
function Hero({ onDetect }) {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-8 border border-sky-400/20"
      style={{ background: 'linear-gradient(145deg,#071428 0%,#0a2040 45%,#0c2d45 75%,#081e35 100%)' }}>
      <Bubbles count={20} />
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -bottom-20 left-1/4 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle,#2dd4bf,transparent 70%)' }} />
      <div className="pointer-events-none absolute -top-10 right-1/4 w-64 h-64 rounded-full opacity-8"
        style={{ background: 'radial-gradient(circle,#38bdf8,transparent 70%)' }} />
      {/* Decorative fish */}
      <div className="animate-drift absolute right-10 top-10 opacity-25 pointer-events-none hidden xl:block">
        <svg viewBox="0 0 120 70" className="w-36 h-20">
          <ellipse cx="60" cy="35" rx="35" ry="20" fill="#2dd4bf"/>
          <path d="M25 35 L5 22 L5 48Z" fill="#2dd4bf"/>
          <path d="M88 30 L110 18 L103 35 L110 52 L88 40Z" fill="#2dd4bf"/>
          <circle cx="78" cy="30" r="5" fill="white"/><circle cx="80" cy="28" r="2.5" fill="#071428"/>
        </svg>
      </div>
      <div className="animate-drift absolute left-16 bottom-12 opacity-15 pointer-events-none hidden xl:block" style={{ animationDelay:'3.5s' }}>
        <svg viewBox="0 0 80 50" className="w-24 h-16">
          <ellipse cx="40" cy="25" rx="24" ry="14" fill="#38bdf8"/>
          <path d="M16 25 L2 16 L2 34Z" fill="#38bdf8"/>
          <circle cx="52" cy="21" r="4" fill="white"/><circle cx="54" cy="19" r="2" fill="#071428"/>
        </svg>
      </div>

      <div className="relative z-10 px-6 py-14 lg:px-14 lg:py-20 text-center">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 border border-teal-400/30 bg-teal-400/10 animate-slideUp">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-teal-300 text-sm font-medium">AI-Powered · Custom MobileNetV2 · 85%+ Accuracy</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-5 leading-tight tracking-tight animate-slideUp" style={{ animationDelay:'0.1s' }}>
          Identify Marine Species<br />
          <span style={{ backgroundImage:'linear-gradient(90deg,#2dd4bf,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            with Deep Learning
          </span>
        </h1>

        {/* Ticker line */}
        <p className="text-slate-300 text-lg mb-3 animate-slideUp" style={{ animationDelay:'0.2s' }}>
          Now detecting: <Ticker />
        </p>
        <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto leading-relaxed animate-slideUp" style={{ animationDelay:'0.25s' }}>
          Upload any underwater photo. Our neural network identifies the species, shows confidence scores,
          and delivers detailed marine biology data — all in your browser, no server needed.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 animate-slideUp" style={{ animationDelay:'0.35s' }}>
          <button onClick={onDetect}
            className="animate-glowPulse flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white hover:scale-105 transition-transform"
            style={{ background:'linear-gradient(135deg,#0d9488,#0284c7)' }}>
            <Zap className="w-5 h-5" /> Start Detecting
          </button>
          <a href="#how-it-works"
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-slate-200 border border-slate-500/50 bg-slate-700/40 hover:bg-slate-700/70 transition-colors">
            <Eye className="w-5 h-5 text-sky-400" /> How it works
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto animate-slideUp" style={{ animationDelay:'0.45s' }}>
          {[
            { to:5800, s:'+', label:'Training Images' },
            { to:10,   s:'',  label:'Species' },
            { to:85,   s:'%', label:'Val. Accuracy' },
          ].map(({ to, s, label }) => (
            <div key={label} className="rounded-xl py-4 px-2 border border-slate-600/50 bg-slate-800/60 text-center">
              <p className="text-2xl font-bold text-teal-300 tabular-nums"><Counter to={to} suffix={s} /></p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center opacity-40 animate-bounce">
          <ChevronDown className="w-5 h-5 text-slate-300" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How it works
// ─────────────────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: Upload,    n:'01', title:'Upload Image',    desc:'Drag & drop or click to upload any underwater photo in JPG or PNG format.' },
    { icon: Zap,       n:'02', title:'AI Analysis',     desc:'Custom MobileNetV2 preprocesses and classifies through 2.5M parameters in seconds.' },
    { icon: BarChart3, n:'03', title:'Get Results',     desc:'See detected species, confidence score, top-3 predictions, and full species info.' },
    { icon: Database,  n:'04', title:'Track & Export',  desc:'Every detection is saved. Export as CSV, JSON or PDF report anytime.' },
  ];
  return (
    <div id="how-it-works" className="mb-10">
      <div className="text-center mb-7">
        <h2 className="text-2xl font-bold text-white mb-2">How It Works</h2>
        <p className="text-slate-400 text-sm">Four steps from image to insight</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map(({ icon: Icon, n, title, desc }, i) => (
          <div key={n} className={`relative ${CARD.base} ${CARD.bg} ${CARD.border} p-5 hover:border-teal-400/40 transition-all group`}>
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-9 -right-2 w-4 h-px bg-slate-600 z-10" />
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/25 flex items-center justify-center shrink-0 group-hover:bg-teal-400/20 transition-colors">
                <Icon className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-4xl font-black text-slate-700 leading-none select-none">{n}</span>
            </div>
            <h3 className="text-white font-semibold mb-1.5">{title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Species strip
// ─────────────────────────────────────────────────────────────────────────────
function SpeciesStrip() {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Detectable Species</h2>
          <p className="text-slate-400 text-xs mt-0.5">Arabian Sea · Pakistan focused</p>
        </div>
        <span className="text-xs text-slate-500 border border-slate-600/50 rounded-full px-3 py-1">10 species</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SPECIES_DATA.map(s => {
          const cs = CAT_STYLE[s.category] || CAT_STYLE.fish;
          return (
            <div key={s.id}
              className={`${CARD.base} ${CARD.bg} ${CARD.border} p-4 text-center hover:border-teal-400/40 hover:bg-[#0f2540] transition-all group cursor-default`}>
              <div className="text-3xl mb-2.5 group-hover:scale-110 transition-transform inline-block">
                {EMOJIS[s.commonName] || '🐟'}
              </div>
              <p className="text-white text-xs font-semibold truncate">{s.commonName}</p>
              <p className="text-slate-500 text-xs italic truncate mt-0.5">{s.scientificName}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border capitalize ${cs.badge}`}>
                {s.category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detection tool
// ─────────────────────────────────────────────────────────────────────────────
function DetectionTool() {
  const [preview, setPreview]           = useState(null);
  const [saved, setSaved]               = useState(false);
  const [dragging, setDragging]         = useState(false);
  const [stage, setStage]               = useState(0);
  const [showResult, setShowResult]     = useState(false);
  const imgRef   = useRef(null);
  const timerRef = useRef(null);

  const { isModelLoading, isModelReady, modelError, isProcessing, result, detectFish, reset, retryLoad } = useFishDetector();
  const { addDetection, stats } = useDetectionHistory();

  useEffect(() => {
    if (isProcessing) {
      setStage(0); setShowResult(false); let s = 0;
      timerRef.current = setInterval(() => { s = Math.min(s + 1, STAGES.length - 2); setStage(s); }, 600);
    } else {
      clearInterval(timerRef.current);
      if (result) { setStage(STAGES.length - 1); setTimeout(() => setShowResult(true), 350); }
    }
    return () => clearInterval(timerRef.current);
  }, [isProcessing, result]);

  const load = (file) => {
    if (!file?.type.startsWith('image/')) return;
    reset(); setSaved(false); setShowResult(false);
    const r = new FileReader(); r.onloadend = () => setPreview(r.result); r.readAsDataURL(file);
  };
  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); load(e.dataTransfer.files[0]); }, []);
  const detect = async () => {
    if (!imgRef.current || !isModelReady) return;
    const res = await detectFish(imgRef.current);
    if (res && imgRef.current) { addDetection(res, imgRef.current); setSaved(true); }
  };
  const resetAll = () => { setPreview(null); reset(); setSaved(false); setShowResult(false); setStage(0); };

  return (
    <div id="detection-tool" className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white">Detection Tool</h2>
          <p className="text-slate-400 text-sm mt-0.5">Upload an image to identify marine species</p>
        </div>
        <div className={`flex items-center gap-2.5 ${CARD.base} ${CARD.bg} ${CARD.border} px-4 py-2.5`}>
          <BarChart3 className="w-4 h-4 text-teal-400" />
          <div>
            <p className="text-slate-400 text-xs leading-none">Today</p>
            <p className="text-white font-bold text-xl leading-none mt-0.5 tabular-nums">{stats.todayCount}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Upload panel ── */}
        <div className={`${CARD.base} ${CARD.bg} ${CARD.border} p-6 flex flex-col gap-4 min-h-[22rem]`}>
          <p className="text-white font-semibold flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4 text-teal-400" /> Upload Image
          </p>

          {isModelLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-slate-700 border-t-teal-400 animate-spin" />
              <p className="text-white text-sm font-medium">Loading AI model…</p>
              <p className="text-slate-400 text-xs">Custom MobileNetV2 · 10 species</p>
            </div>
          )}

          {modelError && !isModelLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-12 h-12 text-rose-400" />
              <p className="text-slate-300 text-sm text-center">{modelError}</p>
              <button onClick={retryLoad} className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm transition-colors">
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {isModelReady && !preview && (
            <label
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                dragging ? 'border-teal-400 bg-teal-400/8 scale-[1.01]' : 'border-slate-600 hover:border-teal-500/60 hover:bg-slate-700/30'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${dragging ? 'bg-teal-400/20' : 'bg-slate-700/80'}`}>
                <Camera className={`w-7 h-7 ${dragging ? 'text-teal-300' : 'text-slate-400'}`} />
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-sm">{dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}</p>
                <p className="text-slate-500 text-xs mt-1">JPG, PNG supported</p>
              </div>
              <input type="file" accept="image/*" onChange={(e) => load(e.target.files[0])} className="hidden" />
            </label>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
                <img ref={imgRef} src={preview} alt="Preview" className="w-full h-60 object-contain" crossOrigin="anonymous" />
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                    <div className="w-44 h-44 border-2 border-teal-400 rounded-lg relative">
                      {[['top-0','left-0','border-t-2','border-l-2'],['top-0','right-0','border-t-2','border-r-2'],
                        ['bottom-0','left-0','border-b-2','border-l-2'],['bottom-0','right-0','border-b-2','border-r-2']].map((c,i) => (
                        <div key={i} className={`absolute w-4 h-4 ${c.join(' ')} border-teal-300`} />
                      ))}
                      <div className="absolute left-0 right-0 h-0.5 bg-teal-400/80" style={{ animation:'scanLine 1.5s ease-in-out infinite', top:'50%' }} />
                    </div>
                  </div>
                )}
                {result?.detected && showResult && (
                  <div className="absolute border-2 border-teal-400 rounded animate-fadeIn" style={{ left:'28%', top:'20%', width:'44%', height:'55%' }}>
                    <span className="absolute -top-6 left-0 bg-teal-500 text-white text-xs px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                      {result.species} · {result.confidence}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={detect} disabled={isProcessing || !isModelReady}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  {isProcessing ? <><Loader className="w-4 h-4 animate-spin" />Detecting…</> : <><Zap className="w-4 h-4" />Detect Species</>}
                </button>
                <button onClick={resetAll} className="px-4 py-2.5 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 rounded-xl transition-all text-sm flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Results panel ── */}
        <div className={`${CARD.base} ${CARD.bg} ${CARD.border} p-6 flex flex-col gap-4 min-h-[22rem]`}>
          <p className="text-white font-semibold flex items-center gap-2 text-sm">
            <Fish className="w-4 h-4 text-teal-400" /> Detection Results
          </p>

          {!result && !isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <svg viewBox="0 0 200 200" className="w-28 h-28 opacity-30">
                <defs><linearGradient id="fg1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#2dd4bf'}}/><stop offset="100%" style={{stopColor:'#0891b2'}}/>
                </linearGradient></defs>
                <g style={{animation:'swim 3s ease-in-out infinite'}}>
                  <ellipse cx="100" cy="100" rx="50" ry="30" fill="url(#fg1)"/>
                  <path d="M50 100 L20 85 L20 115Z" fill="url(#fg1)"/>
                  <path d="M145 95 L170 80 L160 100 L170 120 L145 105Z" fill="url(#fg1)"/>
                  <circle cx="130" cy="95" r="5" fill="white"/><circle cx="133" cy="93" r="2" fill="#071428"/>
                </g>
              </svg>
              <p className="text-slate-400 text-sm text-center">Upload an image and click Detect Species</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-t-teal-400 border-r-teal-400 border-transparent animate-spin" />
                <Fish className="w-7 h-7 text-teal-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Analysing image…</p>
                <p className="text-slate-400 text-xs mt-1">Running through neural network</p>
              </div>
              <div className="w-full"><StageBar stage={stage} /></div>
            </div>
          )}

          {result && !isProcessing && showResult && (
            <div className="flex-1 flex flex-col gap-3 animate-fadeIn overflow-y-auto pr-0.5">
              {result.detected ? (
                <>
                  <div className="flex items-center gap-3 bg-teal-400/10 border border-teal-400/30 rounded-xl p-4">
                    <CheckCircle className="w-7 h-7 text-teal-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-teal-400 text-xs font-semibold uppercase tracking-widest">Species Identified</p>
                      <p className="text-white font-bold text-xl truncate mt-0.5">{result.species}</p>
                    </div>
                    {saved && <span className="text-xs text-teal-300 bg-teal-400/15 border border-teal-400/25 px-2.5 py-1 rounded-full shrink-0">✓ Saved</span>}
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const speciesData = getSpeciesByModelLabel(result.species);
                        downloadShareCard({
                          species: result.species,
                          confidence: result.confidence,
                          thumbnail: imgRef.current ? (() => {
                            const c = document.createElement('canvas');
                            c.width = imgRef.current.naturalWidth || 300;
                            c.height = imgRef.current.naturalHeight || 300;
                            c.getContext('2d').drawImage(imgRef.current, 0, 0);
                            return c.toDataURL('image/jpeg', 0.8);
                          })() : null,
                          scientificName: speciesData?.scientificName,
                          category: speciesData?.category,
                        });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Card
                    </button>
                    {(() => {
                      const sd = getSpeciesByModelLabel(result.species);
                      return sd ? (
                        <a href={`/species/${sd.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 border border-slate-600/50 rounded-xl text-xs font-semibold transition-all">
                          <Fish className="w-3.5 h-3.5 text-teal-400" /> Species Info
                        </a>
                      ) : null;
                    })()}
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <p className="text-slate-400 text-xs mb-3 uppercase tracking-widest font-semibold">Confidence Breakdown</p>
                    <div className="space-y-2">
                      {result.allPredictions?.map((p, i) => <Bar key={p.species} label={p.species} value={p.confidence} delay={i * 100} hi={i === 0} />)}
                    </div>
                  </div>
                  <SpeciesPanel name={result.species} />
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 bg-amber-400/8 border border-amber-400/25 rounded-xl p-4">
                    <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-bold text-sm">No Species Matched</p>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">{result.error || 'Image did not match any trained species with sufficient confidence (≥50%).'}</p>
                    </div>
                  </div>
                  {result.allPredictions?.length > 0 && (
                    <div className="bg-slate-800/60 rounded-xl p-4">
                      <p className="text-slate-400 text-xs mb-3 uppercase tracking-widest font-semibold">Closest Matches</p>
                      <div className="space-y-2">
                        {result.allPredictions.map((p, i) => <Bar key={p.species} label={p.species} value={p.confidence} delay={i * 100} />)}
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-800/60 rounded-xl p-4">
                    <p className="text-slate-300 text-xs font-semibold mb-2">Tips for better results</p>
                    <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside leading-relaxed">
                      <li>Use clear, well-lit underwater photos</li>
                      <li>Ensure the species is the main subject</li>
                      <li>Supported: Shark, Dolphin, Whale, Turtle, Jellyfish, Crab, Seahorse, Ray, Octopus, Starfish</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────────────────
export default function UnderwaterSpeciesDetector() {
  const detRef  = useRef(null);
  const navigate = useNavigate();
  const scroll  = () => detRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <style>{`@keyframes scanLine{0%,100%{top:8%}50%{top:88%}}`}</style>

      <Hero onDetect={scroll} />
      <HowItWorks />
      <div ref={detRef}><DetectionTool /></div>
      <SpeciesStrip />

      {/* Bottom nav CTA */}
      <div className={`${CARD.base} ${CARD.bg} border-sky-400/15 overflow-hidden mb-4 relative`}>
        <Bubbles count={10} />
        <div className="relative z-10 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Explore More</h2>
          <p className="text-slate-400 text-sm mb-7 max-w-md mx-auto">
            View analytics on the dashboard, browse the species encyclopedia, or review your detection history.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label:'Dashboard',  path:'/dashboard', icon:BarChart3 },
              { label:'Gallery',    path:'/gallery',   icon:Fish },
              { label:'History',    path:'/history',   icon:Database },
            ].map(({ label, path, icon: Icon }) => (
              <button key={path} onClick={() => navigate(path)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/70 hover:bg-slate-600/80 text-white rounded-xl border border-slate-600/60 transition-all text-sm font-medium">
                <Icon className="w-4 h-4 text-teal-400" /> {label} <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
