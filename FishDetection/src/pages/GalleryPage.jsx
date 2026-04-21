import { useState, useMemo } from 'react';
import { Search, Fish } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SPECIES_DATA, getSpeciesByCategory } from '../utils/speciesData';
import { useDetectionHistory } from '../hooks/useDetectionHistory';
import SpeciesGrid from '../components/Gallery/SpeciesGrid';

const CATEGORIES = [
  { id: 'All',          label: 'All' },
  { id: 'shark',        label: 'Sharks' },
  { id: 'fish',         label: 'Fish' },
  { id: 'invertebrate', label: 'Invertebrates' },
  { id: 'mammal',       label: 'Mammals' },
  { id: 'reptile',      label: 'Reptiles' },
];

export default function GalleryPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const navigate = useNavigate();
  const { history } = useDetectionHistory();

  const detectionCounts = useMemo(() => {
    const counts = {};
    history.forEach(r => {
      if (r.detected && r.species) {
        counts[r.species] = (counts[r.species] || 0) + 1;
        counts[r.species.toLowerCase()] = (counts[r.species.toLowerCase()] || 0) + 1;
      }
    });
    return counts;
  }, [history]);

  const filtered = useMemo(() => {
    let list = cat !== 'All' ? getSpeciesByCategory(cat) : SPECIES_DATA;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.commonName.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q));
    }
    return list;
  }, [search, cat]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">Species Gallery</h1>
        <p className="text-slate-400 text-sm flex items-center gap-1.5">
          <Fish className="w-3.5 h-3.5 text-teal-400" />
          {SPECIES_DATA.length} marine species detectable by our AI
        </p>
      </div>

      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or scientific name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0d1f35] border border-sky-400/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/50 transition-colors text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                cat === c.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-[#0d1f35] text-slate-400 border border-sky-400/20 hover:border-teal-400/40 hover:text-white'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-slate-500 text-xs">Showing {filtered.length} of {SPECIES_DATA.length} species</p>
      </div>

      <SpeciesGrid
        species={filtered}
        detectionCounts={detectionCounts}
        onSpeciesClick={s => navigate(`/species/${s.id}`)}
      />
    </div>
  );
}
