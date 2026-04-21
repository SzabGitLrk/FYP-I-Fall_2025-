import { Fish, Shell, Waves, Anchor } from 'lucide-react';

const CAT = {
  shark:        { badge: 'bg-blue-400/15 text-blue-300 border-blue-400/30',   icon: Fish },
  fish:         { badge: 'bg-teal-400/15 text-teal-300 border-teal-400/30',   icon: Fish },
  invertebrate: { badge: 'bg-purple-400/15 text-purple-300 border-purple-400/30', icon: Shell },
  mammal:       { badge: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',   icon: Waves },
  reptile:      { badge: 'bg-green-400/15 text-green-300 border-green-400/30', icon: Anchor },
  coral:        { badge: 'bg-pink-400/15 text-pink-300 border-pink-400/30',   icon: Shell },
  other:        { badge: 'bg-slate-400/15 text-slate-300 border-slate-400/30', icon: Fish },
};

const EMOJIS = {
  'Crab':'🦀','Dolphin':'🐬','Jellyfish':'🪼','Octopus':'🦑',
  'Sea Ray':'🌊','Seahorse':'🐠','Shark':'🦈','Starfish':'⭐','Sea Turtle':'🐢','Whale':'🐋',
};

export default function SpeciesCard({ species, detectionCount = 0, onClick }) {
  const c = CAT[species.category] || CAT.other;
  const detected = detectionCount > 0;

  return (
    <button onClick={onClick}
      className="w-full bg-[#0d1f35] rounded-2xl p-4 border border-sky-400/20 hover:border-teal-400/40 hover:bg-[#0f2540] transition-all text-center group relative">
      {detected && (
        <div className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
          ✓ {detectionCount}
        </div>
      )}
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">
        {EMOJIS[species.commonName] || '🐟'}
      </div>
      <p className="text-white font-semibold text-sm truncate">{species.commonName}</p>
      <p className="text-slate-500 text-xs italic truncate mt-0.5">{species.scientificName}</p>
      <span className={`inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full border capitalize ${c.badge}`}>
        {species.category}
      </span>
    </button>
  );
}
