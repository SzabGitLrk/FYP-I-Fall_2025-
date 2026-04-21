import { X, Fish, MapPin, Lightbulb } from 'lucide-react';

// Category colors
const categoryColors = {
  shark: 'text-blue-400',
  fish: 'text-teal-400',
  invertebrate: 'text-purple-400',
  coral: 'text-pink-400',
  mammal: 'text-cyan-400',
  reptile: 'text-green-400',
  other: 'text-gray-400'
};

/**
 * Species detail modal
 * @param {Object} props
 * @param {Object|null} props.species - Species data object
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 */
export default function SpeciesModal({ species, isOpen, onClose }) {
  if (!isOpen || !species) return null;

  const categoryColor = categoryColors[species.category] || categoryColors.other;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-blue-950 bg-opacity-95 backdrop-blur-md rounded-2xl border border-blue-400 border-opacity-30 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-blue-300 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-blue-700">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 bg-${species.category === 'shark' ? 'blue' : species.category === 'fish' ? 'teal' : species.category === 'invertebrate' ? 'purple' : 'pink'}-500 bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Fish className={`w-8 h-8 ${categoryColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{species.commonName}</h2>
              {species.scientificName && (
                <p className="text-blue-300 italic text-sm mt-1">{species.scientificName}</p>
              )}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColor} bg-white bg-opacity-10`}>
                {species.category}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-blue-100 leading-relaxed">{species.description}</p>
          </div>

          {/* Habitat */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h3 className="text-white font-medium">Habitat</h3>
            </div>
            <p className="text-blue-200 text-sm">{species.habitat}</p>
          </div>

          {/* Conservation Status */}
          {species.conservationStatus && (
            <div className="flex items-center gap-2">
              <span className="text-blue-300 text-sm">Conservation Status:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-10 text-yellow-300">
                {species.conservationStatus}
              </span>
            </div>
          )}

          {/* Fun Facts */}
          {species.funFacts && species.funFacts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h3 className="text-white font-medium">Fun Facts</h3>
              </div>
              <ul className="space-y-2">
                {species.funFacts.map((fact, index) => (
                  <li key={index} className="flex items-start gap-2 text-blue-200 text-sm">
                    <span className="text-teal-400 mt-1">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-blue-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
