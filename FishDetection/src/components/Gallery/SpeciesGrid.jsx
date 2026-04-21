import SpeciesCard from './SpeciesCard';
import { Fish } from 'lucide-react';

/**
 * Grid of species cards
 * @param {Object} props
 * @param {Array} props.species - Array of species data
 * @param {Object} props.detectionCounts - Map of species name to detection count
 * @param {Function} props.onSpeciesClick - Handler when species card is clicked
 */
export default function SpeciesGrid({ species, detectionCounts = {}, onSpeciesClick }) {
  if (!species || species.length === 0) {
    return (
      <div className="text-center py-12">
        <Fish className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-50" />
        <p className="text-blue-300 text-lg">No species found</p>
        <p className="text-blue-400 text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {species.map((speciesItem) => {
        // Get detection count for this species (match by common name)
        const count = detectionCounts[speciesItem.commonName] || 
                      detectionCounts[speciesItem.commonName.toLowerCase()] || 
                      0;
        
        return (
          <SpeciesCard
            key={speciesItem.id}
            species={speciesItem}
            detectionCount={count}
            onClick={() => onSpeciesClick(speciesItem)}
          />
        );
      })}
    </div>
  );
}
