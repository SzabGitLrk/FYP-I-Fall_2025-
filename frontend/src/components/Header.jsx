import React from "react";
import { Activity } from "lucide-react";

const Header = ({ pulse }) => (
  <header className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-teal-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div
            className={`bg-gradient-to-br from-teal-500 to-cyan-600 p-2 rounded-xl shadow-lg transition-all duration-500 ${
              pulse ? "scale-110 rotate-12" : "scale-100 rotate-0"
            }`}
          >
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent animate-pulse">
              RepoAssist AI
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              AI Medical Report Assistant
            </p>
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default Header;