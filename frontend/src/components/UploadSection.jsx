import React from "react";
import { Upload, Activity } from "lucide-react";

const UploadSection = ({ fileInputRef, handleFileSelect, preview, isProcessing, reportType, setReportType, handleUpload, file }) => (
  <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
    <div className="text-center mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Upload Medical Report</h2>
      <p className="text-gray-600">Upload your medical report for instant AI analysis</p>
    </div>
    <div 
      onClick={() => fileInputRef.current?.click()} 
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileSelect(e);
      }}
      className="border-3 border-dashed border-teal-300 rounded-xl p-8 sm:p-12 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 transform hover:scale-105"
    >
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-gradient-to-br from-teal-100 to-cyan-100 p-6 rounded-full animate-bounce shadow-lg">
          <Upload className="w-12 h-12 text-teal-600 animate-pulse" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700 mb-1">Click to upload or drag and drop</p>
          <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
        </div>
      </div>
    </div>
    {preview && <img src={preview} alt="Preview" className="max-w-full h-auto rounded-lg shadow-md mx-auto mt-6" style={{ maxHeight: "300px" }} />}
    
    {preview && file && !isProcessing && (
      <div className="mt-8 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Select Report Type:</h3>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
          {["CBC", "HbA1c", "Creatinine"].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
                reportType === type
                  ? "bg-teal-600 text-white shadow-md transform scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Report Type Specific Info */}
        <div className="w-full max-w-2xl bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6 animate-fade-in">
          <h4 className="font-bold text-teal-800 mb-2 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            About {reportType} Analysis
          </h4>
          <p className="text-sm text-teal-700 leading-relaxed">
            {reportType === "CBC" && "CBC (Complete Blood Count) measures various components of your blood, including red cells, white cells, and platelets. It's a fundamental test for overall health and detecting anemia or infection."}
            {reportType === "HbA1c" && "HbA1c measures your average blood sugar levels over the past 2-3 months. It is the primary test used for diabetes management and monitoring long-term glucose control."}
            {reportType === "Creatinine" && "Creatinine levels help evaluate kidney function. Our AI will analyze your serum creatinine and eGFR values to provide insights into your renal health."}
          </p>
          <div className="mt-3 flex gap-4">
             <span className="text-xs bg-white text-teal-600 px-2 py-1 rounded border border-teal-100 font-medium">
               {reportType === "CBC" ? "✓ Detailed Parameters" : reportType === "HbA1c" ? "✓ 3-Month Average" : "✓ Kidney Function"}
             </span>
             <span className="text-xs bg-white text-teal-600 px-2 py-1 rounded border border-teal-100 font-medium">
               ✓ AI Summary
             </span>
             <span className="text-xs bg-white text-teal-600 px-2 py-1 rounded border border-teal-100 font-medium">
               ✓ Voice Output
             </span>
          </div>
        </div>
        
        <button
          onClick={handleUpload}
          className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full sm:w-auto text-lg flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          <span>{`Analyze ${reportType} Report`}</span>
        </button>
      </div>
    )}

    {isProcessing && (
      <div className="mt-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className="mt-4 text-gray-600 font-medium">Analyzing report with AI...</p>
      </div>
    )}
  </div>
);

export default UploadSection;