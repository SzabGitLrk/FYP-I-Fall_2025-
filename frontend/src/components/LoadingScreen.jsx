import React from "react";
import { Activity } from "lucide-react";

const LoadingScreen = ({ loadingProgress }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600">
    <div className="text-center">
      <div className="mb-8 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-spin">
            <div className="h-32 w-32 rounded-full border-8 border-transparent border-t-white border-r-white"></div>
          </div>
          <div className="absolute inset-2 animate-spin" style={{ animationDirection: "reverse", animationDuration: "2s" }}>
            <div className="h-28 w-28 rounded-full border-8 border-transparent border-b-cyan-200 border-l-cyan-200"></div>
          </div>
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div className="absolute h-20 w-20 animate-ping rounded-full bg-white opacity-20"></div>
            <div className="relative rounded-full bg-white p-4 shadow-2xl">
              <Activity className="h-12 w-12 text-teal-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <h1 className="mb-2 text-4xl font-bold text-white animate-pulse">RepoAssist AI</h1>
      <p className="mb-8 text-xl text-cyan-100">AI Medical Report Assistant</p>
      <div className="mx-auto w-80 mb-4">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-white to-cyan-200 transition-all duration-300 ease-out rounded-full" style={{ width: `${loadingProgress}%` }}></div>
        </div>
      </div>
      <p className="text-white text-sm font-medium">{loadingProgress}%</p>
      <div className="mt-12 grid grid-cols-2 gap-4 text-white">
        {["OCR Scanning", "AI Analysis", "Voice Support", "Multi-Language"].map((feature, index) => (
          <div key={index} className="flex items-center space-x-2 opacity-0 animate-fadeIn" style={{ animationDelay: `${(index + 1) * 0.5}s`, animationFillMode: "forwards" }}>
            <div className="h-3 w-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default LoadingScreen;