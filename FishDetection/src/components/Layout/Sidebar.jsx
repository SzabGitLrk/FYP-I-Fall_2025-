import { NavLink } from 'react-router-dom';
import { Camera, BarChart3, Fish, History, X } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Detection', icon: Camera },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/gallery', label: 'Species Gallery', icon: Fish },
  { path: '/history', label: 'History', icon: History }
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`
      fixed top-0 left-0 h-full w-64 z-40
      bg-blue-950 bg-opacity-95 backdrop-blur-md
      border-r border-blue-700
      transform transition-transform duration-300 ease-in-out
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-2 rounded-xl w-12 h-12 flex items-center justify-center shadow-lg border border-teal-300">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="sidebarLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#e0f2fe', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <ellipse cx="50" cy="50" rx="25" ry="15" fill="url(#sidebarLogoGradient)"/>
                <path d="M 25 50 L 10 42 L 10 58 Z" fill="url(#sidebarLogoGradient)"/>
                <path d="M 73 47 L 88 38 L 82 50 L 88 62 L 73 53 Z" fill="url(#sidebarLogoGradient)"/>
                <circle cx="62" cy="47" r="4" fill="white"/>
                <circle cx="64" cy="45" r="2" fill="#0f766e"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Marine AI</h1>
              <p className="text-blue-300 text-xs">Species Detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-blue-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg
              transition-all duration-200
              ${isActive 
                ? 'bg-teal-500 bg-opacity-20 text-teal-300 border border-teal-500 border-opacity-30' 
                : 'text-blue-200 hover:bg-blue-800 hover:bg-opacity-50 hover:text-white'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
        <div className="text-center">
          <p className="text-blue-400 text-xs">Powered by TensorFlow.js</p>
          <p className="text-blue-500 text-xs mt-1">MobileNet v2</p>
        </div>
      </div>
    </aside>
  );
}
