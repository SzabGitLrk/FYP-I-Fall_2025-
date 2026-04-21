import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  ArrowLeft, MapPin, Lightbulb, Shield, Fish,
  Clock, Target, BarChart3, ExternalLink
} from 'lucide-react';
import { SPECIES_DATA, getSpeciesByCategory } from '../utils/speciesData';
import { useDetectionHistory } from '../hooks/useDetectionHistory';

const EMOJIS = {
  'Crab':'🦀','Dolphin':'🐬','Jellyfish':'🪼','Octopus':'🦑',
  'Sea Ray':'🌊','Seahorse':'🐠','Shark':'🦈','Starfish':'⭐','Sea Turtle':'🐢','Whale':'🐋',
};

const CAT_STYLE = {
  shark:        'bg-blue-400/15 text-blue-300 border-blue-400/30',
  fish:         'bg-teal-400/15 text-teal-300 border-teal-400/30',
  invertebrate: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
  mammal:       'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
  reptile:      'bg-green-400/15 text-green-300 border-green-400/30',
};

const STATUS_STYLE = {
  'Endangered':    'bg-rose-400/15 text-rose-300 border-rose-400/30',
  'Vulnerable':    'bg-amber-400/15 text-amber-300 border-amber-400/30',
  'Least Concern': 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
};

function StatCard({ icon: Icon, label, value, color = 'text-teal-300' }) {
  return (
    <div className="bg-[#0d1f35] rounded-xl p-4 border border-sky-400/20 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-teal-400" />
      </div>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className={`font-bold text-lg ${color} tabular-nums`}>{value}</p>
      </div>
    </div>
  );
}

export default function SpeciesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { history } = useDetectionHistory();

  const species = SPECIES_DATA.find(s => s.id === id);

  // Detection history for this species
  const speciesHistory = useMemo(() => {
    if (!species) return [];
    return history.filter(r =>
      r.detected &&
      r.species?.toLowerCase() === species.commonName.toLowerCase()
    ).slice(0, 10);
  }, [history, species]);

  const avgConfidence = useMemo(() => {
    if (!speciesHistory.length) return 0;
    return Math.round(speciesHistory.reduce((s, r) => s + r.confidence, 0) / speciesHistory.length);
  }, [speciesHistory]);

  const bestConfidence = useMemo(() => {
    if (!speciesHistory.length) return 0;
    return Math.max(...speciesHistory.map(r => r.confidence));
  }, [speciesHistory]);

  // Related species — same category, excluding current
  const related = useMemo(() => {
    if (!species) return [];
    return getSpeciesByCategory(species.category)
      .filter(s => s.id !== species.id)
      .slice(0, 4);
  }, [species]);

  if (!species) {
    return (
      <div className="p-8 text-center">
        <Fish className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Species not found</h2>
        <p className="text-slate-400 mb-6">No species with ID "{id}" exists in our database.</p>
        <button onClick={() => navigate('/gallery')}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors">
          Back to Gallery
        </button>
      </div>
    );
  }

  const catStyle  = CAT_STYLE[species.category]  || 'bg-slate-400/15 text-slate-300 border-slate-400/30';
  const statStyle = STATUS_STYLE[species.conservationStatus] || 'bg-sky-400/15 text-sky-300 border-sky-400/30';
  const emoji     = EMOJIS[species.commonName] || '🐟';

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero card */}
      <div className="rounded-2xl border border-sky-400/20 overflow-hidden mb-6"
        style={{ background: 'linear-gradient(145deg,#071428 0%,#0a2040 50%,#0c2d45 100%)' }}>
        <div className="p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Emoji */}
          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-6xl lg:text-7xl">
            {emoji}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${catStyle}`}>
                {species.category}
              </span>
              {species.conservationStatus && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statStyle}`}>
                  <Shield className="w-3 h-3 inline mr-1" />{species.conservationStatus}
                </span>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-1">{species.commonName}</h1>
            <p className="text-slate-400 italic text-lg mb-4">{species.scientificName}</p>
            <p className="text-slate-300 leading-relaxed text-sm lg:text-base">{species.description}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Target}   label="Times Detected"   value={speciesHistory.length} />
        <StatCard icon={BarChart3} label="Avg Confidence"   value={speciesHistory.length ? `${avgConfidence}%` : '—'} />
        <StatCard icon={Target}   label="Best Confidence"  value={speciesHistory.length ? `${bestConfidence}%` : '—'} color="text-emerald-300" />
        <StatCard icon={Clock}    label="Last Detected"
          value={speciesHistory[0] ? new Date(speciesHistory[0].timestamp).toLocaleDateString() : 'Never'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Left col — details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Habitat */}
          <div className="bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h2 className="text-white font-semibold">Habitat</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{species.habitat}</p>
          </div>

          {/* Fun facts */}
          {species.funFacts?.length > 0 && (
            <div className="bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h2 className="text-white font-semibold">Did You Know?</h2>
              </div>
              <div className="space-y-3">
                {species.funFacts.map((fact, i) => (
                  <div key={i} className="flex gap-3 bg-amber-400/8 rounded-xl p-3 border border-amber-400/15">
                    <span className="text-amber-400 font-bold text-sm shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-slate-300 text-sm leading-relaxed">{fact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detection history */}
          <div className="bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h2 className="text-white font-semibold">Your Detection History</h2>
              </div>
              {speciesHistory.length > 0 && (
                <Link to="/history" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
                  View all <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {speciesHistory.length === 0 ? (
              <div className="text-center py-8">
                <Fish className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">No detections yet for this species.</p>
                <Link to="/" className="inline-block mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  Try detecting one →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {speciesHistory.map(record => (
                  <div key={record.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                    {record.thumbnail ? (
                      <img src={record.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-lg">{emoji}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{record.species}</p>
                      <p className="text-slate-500 text-xs">{new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-teal-300 font-bold text-sm tabular-nums">{record.confidence}%</p>
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-teal-400 rounded-full" style={{ width: `${record.confidence}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col — related */}
        <div className="space-y-4">
          <div className="bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-5">
            <h2 className="text-white font-semibold mb-4 text-sm">Related Species</h2>
            {related.length === 0 ? (
              <p className="text-slate-500 text-xs">No related species found.</p>
            ) : (
              <div className="space-y-2">
                {related.map(s => (
                  <Link key={s.id} to={`/species/${s.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-teal-400/30 hover:bg-slate-700/50 transition-all group">
                    <span className="text-2xl shrink-0">{EMOJIS[s.commonName] || '🐟'}</span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium group-hover:text-teal-300 transition-colors truncate">{s.commonName}</p>
                      <p className="text-slate-500 text-xs italic truncate">{s.scientificName}</p>
                    </div>
                    <ArrowLeft className="w-3 h-3 text-slate-600 rotate-180 shrink-0 ml-auto" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-[#0d1f35] rounded-2xl border border-sky-400/20 p-5">
            <h2 className="text-white font-semibold mb-4 text-sm">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/"
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Fish className="w-4 h-4" /> Detect This Species
              </Link>
              <Link to="/gallery"
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 rounded-xl text-sm font-medium transition-colors border border-slate-600/50">
                <BarChart3 className="w-4 h-4" /> Back to Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
