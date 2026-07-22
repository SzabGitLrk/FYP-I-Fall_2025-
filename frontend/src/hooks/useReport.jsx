import { useState, useRef } from "react";
import { processMedicalReport } from "../services/cbcService";

export const useReport = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null); // ✅ NEW
  const [reportType, setReportType] = useState("CBC");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target?.files ? e.target.files[0] : e.dataTransfer?.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setReport(null);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    await processReport(file, reportType);
  };

  const processReport = async (uploadedFile, currentReportType) => {
    setIsProcessing(true);
    setError(null);

    try {
      const finalReport = await processMedicalReport(uploadedFile, currentReportType);

      // 🟡 OCR FAILED → NOT A CRASH
      if (finalReport.status === "ocr_failed") {
        setError(finalReport.message);
        setReport(null);
        return;
      }

      // 🔴 TRUE BACKEND ERROR
      if (finalReport.error) {
        setError(finalReport.error);
        setReport(null);
        return;
      }

      // ✅ SUCCESS (even partial CBC)
      setReport(finalReport);
    } catch (err) {
      console.error("Report processing error:", err);
      setError(err.message || "Unable to connect to server");
      setReport(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetReport = () => {
    setReport(null);
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return {
    file,
    preview,
    isProcessing,
    report,
    error,              // ✅ expose error
    reportType,
    setReportType,
    handleUpload,
    fileInputRef,
    handleFileSelect,
    resetReport
  };
};
