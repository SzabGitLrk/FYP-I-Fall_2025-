import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import LoadingScreen from "../components/LoadingScreen";
import Loading2 from "../components/Loading2";
import UploadSection from "../components/UploadSection";
import ReportSection from "../components/ReportSection";
import Footer from "../components/Footer";
import { useLoading } from "../hooks/useLoading";
import { useSpeech } from "../hooks/useSpeech";
import { useReport } from "../hooks/useReport";
import { Camera, Activity, Volume2, FileText } from "lucide-react";

const RepoAssist = () => {
  const { isLoading, loadingProgress } = useLoading();
  const {
    selectedLanguage,
    setSelectedLanguage,
    isSpeaking,
    speakReport,
    stopSpeaking,
    audioUrl,
  } = useSpeech();

  const {
    file,
    preview,
    isProcessing,
    report,
    error,
    reportType,
    setReportType,
    handleUpload,
    fileInputRef,
    handleFileSelect,
    resetReport,
  } = useReport();

  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {isLoading && <LoadingScreen loadingProgress={loadingProgress} />}

      {!isLoading && (
        <>
          <Header pulse={pulse} />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* ================= ERROR VIEW ================= */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-bold">Error analyzing report:</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                    <p className="text-xs text-red-500 mt-2">
                      Please try again or check the console logs for more details.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= UPLOAD VIEW ================= */}
            {!report && !isProcessing && (
              <>
                <UploadSection
                  fileInputRef={fileInputRef}
                  handleFileSelect={handleFileSelect}
                  preview={preview}
                  isProcessing={isProcessing}
                  reportType={reportType}
                  setReportType={setReportType}
                  handleUpload={handleUpload}
                  file={file}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  <Feature
                    icon={<Camera className="w-6 h-6 text-teal-600 animate-pulse" />}
                    title="OCR Scanning"
                    desc="Advanced text extraction from reports"
                    color="teal"
                  />
                  <Feature
                    icon={<Activity className="w-6 h-6 text-cyan-600 animate-pulse" />}
                    title="AI Analysis"
                    desc="Intelligent health insights"
                    color="cyan"
                  />
                  <Feature
                    icon={<Volume2 className="w-6 h-6 text-green-600 animate-pulse" />}
                    title="Voice Output"
                    desc="Audio summary in English & Urdu"
                    color="green"
                  />
                  <Feature
                    icon={<FileText className="w-6 h-6 text-blue-600 animate-pulse" />}
                    title="Instant Results"
                    desc="Fast and accurate analysis"
                    color="blue"
                  />
                </div>
              </>
            )}

            {/* ================= PROCESSING VIEW ================= */}
            {isProcessing && (
              <Loading2 />
            )}

            {/* ================= REPORT VIEW ================= */}
            {report !== null && (
              <ReportSection
                report={report}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                isSpeaking={isSpeaking}
                audioUrl={audioUrl}
                speakReport={() => {
                  const params = report.parameters || [];
                  const paramText = params
                    .filter((p) => {
                      const valStr = String(p.value).toUpperCase();
                      return p.value !== null && valStr !== "N/A" && valStr !== "NULL";
                    })
                    .map((p) => {
                      const statusPhrase = p.status && p.status !== "unknown" ? `, Status is ${p.status}` : "";
                      return `${p.name} is ${p.value} ${p.unit || ""}${statusPhrase}`;
                    })
                    .join(". ");
                  
                  // Use Urdu summary from backend if Urdu is selected
                  const summaryText = (selectedLanguage === "ur" && report.summary_ur) 
                    ? report.summary_ur 
                    : report.summary;
                    
                  const fullText = `Report Summary. ${summaryText}. Parameters Analysis. ${paramText}.`;
                  speakReport(fullText);
                }}
                stopSpeaking={stopSpeaking}
                resetReport={() => {
                  stopSpeaking(); // Clear audio state
                  resetReport();
                }}
              />
            )}
          </main>

          <Footer />
        </>
      )}
    </div>
  );
};

/* ================= FEATURE CARD ================= */
const colorStyles = {
  teal: { bg: "bg-teal-100", border: "border-teal-100" },
  cyan: { bg: "bg-cyan-100", border: "border-cyan-100" },
  green: { bg: "bg-green-100", border: "border-green-100" },
  blue: { bg: "bg-blue-100", border: "border-blue-100" },
};

const Feature = ({ icon, title, desc, color }) => (
  <div
    className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border ${colorStyles[color]?.border || 'border-transparent'}`}
  >
    <div
      className={`${colorStyles[color]?.bg || 'bg-gray-100'} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}
    >
      {icon}
    </div>
    <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{desc}</p>
  </div>
);

export default RepoAssist;
