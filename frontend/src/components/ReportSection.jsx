import React from "react";
import {
  FileText,
  AlertCircle,
  Volume2,
  MicOff,
  Download,
  Activity,
  Microscope,
} from "lucide-react";
import {
  getStatusColor,
  getStatusIcon,
  getTrendIcon,
  getBarChartData,
  getRadarChartData,
  getStatusDistribution,
} from "../utils/helpers";
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import ChatbotAssistant from "./ChatbotAssistant";

/* =========================
   🟡 OCR FAILED VIEW
========================= */
const OCRFailedView = ({ message, resetReport }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
    <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
    <h2 className="text-xl font-bold text-gray-800">
      Unable to Analyze Report
    </h2>
    <p className="text-gray-600">
      {message ||
        "CBC report text was detected, but values could not be extracted. Please upload a clearer image."}
    </p>
    <button
      onClick={resetReport}
      className="mt-4 bg-teal-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"
    >
      Upload Another Report
    </button>
  </div>
);

/* =========================
   🟢 MAIN COMPONENT
========================= */
const ReportSection = ({
  report,
  selectedLanguage,
  setSelectedLanguage,
  isSpeaking,
  speakReport,
  stopSpeaking,
  resetReport,
  audioUrl,
}) => {
  // 🛑 SAFETY CHECK
  if (!report) return null;

  // 🟡 OCR FAILED STATE
  if (report.status === "ocr_failed") {
    return (
      <OCRFailedView
        message={report.message}
        resetReport={resetReport}
      />
    );
  }

  // 🟢 FALLBACK UNIT MAP — used when backend doesn't return units
  const UNIT_FALLBACKS = {
    // CBC
    "hemoglobin":                   "g/dL",
    "hgb":                          "g/dL",
    "hb":                           "g/dL",
    "hematocrit":                   "%",
    "hct":                          "%",
    "pcv":                          "%",
    "packed cell volume":           "%",
    "rbc":                          "10⁶/µL",
    "red blood cells":              "10⁶/µL",
    "red blood cell count":         "10⁶/µL",
    "wbc":                          "10³/µL",
    "white blood cells":            "10³/µL",
    "white blood cell count":       "10³/µL",
    "total leukocyte count":        "10³/µL",
    "tlc":                          "10³/µL",
    "platelets":                    "10³/µL",
    "platelet count":               "10³/µL",
    "plt":                          "10³/µL",
    "mcv":                          "fL",
    "mean corpuscular volume":      "fL",
    "mch":                          "pg",
    "mean corpuscular hemoglobin":  "pg",
    "mchc":                         "g/dL",
    "rdw":                          "%",
    "rdw-cv":                       "%",
    "mpv":                          "fL",
    "mean platelet volume":         "fL",
    "neutrophils":                  "%",
    "lymphocytes":                  "%",
    "monocytes":                    "%",
    "eosinophils":                  "%",
    "basophils":                    "%",
    "neutrophil count":             "10³/µL",
    "lymphocyte count":             "10³/µL",
    "monocyte count":               "10³/µL",
    "eosinophil count":             "10³/µL",
    "basophil count":               "10³/µL",
    // Metabolic / LFT / RFT
    "glucose":                      "mg/dL",
    "fasting blood sugar":          "mg/dL",
    "fbs":                          "mg/dL",
    "blood sugar":                  "mg/dL",
    "hba1c":                        "%",
    "hba1c level":                  "%",
    "hba1c_level":                  "%",
    "blood glucose":                "mg/dL",
    "blood glucose level":          "mg/dL",
    "blood_glucose_level":          "mg/dL",
    "creatinine":                   "mg/dL",
    "serum creatinine":             "mg/dL",
    "serum_creatinine":             "mg/dL",
    "s. creatinine":                "mg/dL",
    "creatinine level":             "mg/dL",
    "egfr":                         "mL/min/1.73m²",
    "urea":                         "mg/dL",
    "blood urea nitrogen":          "mg/dL",
    "bun":                          "mg/dL",
    "uric acid":                    "mg/dL",
    "sodium":                       "mEq/L",
    "potassium":                    "mEq/L",
    "chloride":                     "mEq/L",
    "bicarbonate":                  "mEq/L",
    "calcium":                      "mg/dL",
    "phosphorus":                   "mg/dL",
    "magnesium":                    "mg/dL",
    "albumin":                      "g/dL",
    "total protein":                "g/dL",
    "bilirubin":                    "mg/dL",
    "total bilirubin":              "mg/dL",
    "direct bilirubin":             "mg/dL",
    "indirect bilirubin":           "mg/dL",
    "alt":                          "U/L",
    "alanine aminotransferase":     "U/L",
    "sgpt":                         "U/L",
    "ast":                          "U/L",
    "aspartate aminotransferase":   "U/L",
    "sgot":                         "U/L",
    "alp":                          "U/L",
    "alkaline phosphatase":         "U/L",
    "ggt":                          "U/L",
    "cholesterol":                  "mg/dL",
    "total cholesterol":            "mg/dL",
    "hdl":                          "mg/dL",
    "ldl":                          "mg/dL",
    "triglycerides":                "mg/dL",
    "tsh":                          "µIU/mL",
    "t3":                           "ng/dL",
    "t4":                           "µg/dL",
    "free t3":                      "pg/mL",
    "free t4":                      "ng/dL",
    "esr":                          "mm/hr",
    "crp":                          "mg/L",
    "c-reactive protein":           "mg/L",
    "ferritin":                     "ng/mL",
    "iron":                         "µg/dL",
    "tibc":                         "µg/dL",
    "vitamin d":                    "ng/mL",
    "vitamin b12":                  "pg/mL",
    "folate":                       "ng/mL",
    "psa":                          "ng/mL",
    "inr":                          "",
    "pt":                           "seconds",
    "aptt":                         "seconds",
    "fibrinogen":                   "mg/dL",
  };

  const resolveUnit = (param) => {
    if (param.unit && String(param.unit).trim() !== "") return param.unit;
    const key = (param.name || "").toLowerCase().trim();
    return UNIT_FALLBACKS[key] || "";
  };

  // 🟢 SAFE FALLBACKS
  const parameters = (report.parameters || [])
    .filter(
      (param) =>
        param.value !== null &&
        param.value !== undefined &&
        param.value !== "N/A" &&
        param.value !== "n/a" &&
        String(param.value).trim() !== ""
    )
    .map((param) => ({ ...param, unit: resolveUnit(param) }));

  const summary =
    report.summary || "No summary available for this report.";
  const recommendations =
    report.recommendations || [
      "Consult a qualified healthcare professional",
    ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-800">
                Report Analysis
              </h2>
              <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {report.reportType || "Medical"}
              </span>
            </div>
            <p className="text-gray-600 flex items-center gap-3">
              <span className="flex items-center">
                <span className="font-semibold mr-1">Date:</span> {report.date}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            {/* Language Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${selectedLanguage === "en" ? "bg-white shadow text-teal-600" : "text-gray-500"
                  }`}
                onClick={() => setSelectedLanguage("en")}
              >
                English
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${selectedLanguage === "ur" ? "bg-white shadow text-teal-600" : "text-gray-500"
                  }`}
                onClick={() => setSelectedLanguage("ur")}
              >
                Urdu
              </button>
            </div>

            {/* Speak Button */}
            {/* Audio Controls */}
            {/* Speak/Regenerate Button */}
            <button
              onClick={isSpeaking ? stopSpeaking : speakReport}
              className={`p-2 rounded-full transition-colors ${isSpeaking ? "bg-teal-100 text-teal-600 animate-pulse" : "bg-teal-100 text-teal-600"
                }`}
              title={isSpeaking ? "Generating..." : "Generate Audio"}
              disabled={isSpeaking}
            >
              {isSpeaking ? <Activity className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Audio Controls (Visible only if URL exists) */}
            {audioUrl && (
              <audio
                key={audioUrl}
                controls
                src={audioUrl}
                className="h-10 w-48"
                autoPlay
              />
            )}

            <div
              className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(
                report.status || "normal"
              )}`}
            >
              {(report.status || "normal").toUpperCase()}
            </div>
          </div>
        </div>

        {/* AI SUMMARY */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-600 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" />
            AI Summary
          </h3>
          <p className="text-gray-700">{summary}</p>
        </div>

        {/* PERIPHERAL FILM FINDINGS */}
        {report.peripheral_findings && report.peripheral_findings.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Microscope className="w-5 h-5 mr-2 text-purple-600" />
              Peripheral Film / Remarks Analysis
            </h3>
            <div className="space-y-3">
              {report.peripheral_findings.map((finding, index) => (
                <div key={index} className="bg-white bg-opacity-60 rounded-md p-3 border border-purple-100 shadow-sm">
                  <p className="font-bold text-purple-800 text-sm mb-1">{finding.term}</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{finding.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI PREDICTION */}
        {report.prediction && report.prediction.disease && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              AI Analysis Result
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-blue-800">
                {report.prediction.disease}
              </p>
              {report.prediction.confidence && (
                <span className="text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  Confidence: {report.prediction.confidence}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* PARAMETERS */}
        {parameters.length > 0 && (() => {
          const statusStyles = {
            normal:   { border: "border-green-200",  bg: "bg-green-50",   badge: "bg-green-100 text-green-700",   valueCls: "text-green-700" },
            low:      { border: "border-blue-200",   bg: "bg-blue-50",    badge: "bg-blue-100 text-blue-700",     valueCls: "text-blue-700"  },
            high:     { border: "border-yellow-200", bg: "bg-yellow-50",  badge: "bg-yellow-100 text-yellow-700", valueCls: "text-yellow-600" },
            critical: { border: "border-red-200",    bg: "bg-red-50",     badge: "bg-red-100 text-red-700",       valueCls: "text-red-700"   },
          };

          return (
            <>
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                Test Parameters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {parameters.map((param, index) => {
                  const key = (param.status || "normal").toLowerCase();
                  const style = statusStyles[key] || statusStyles.normal;

                  return (
                    <div
                      key={index}
                      className={`rounded-xl p-4 border-2 ${style.border} ${style.bg}`}
                    >
                      {/* Name + Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-gray-800 text-sm">{param.name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${style.badge}`}>
                          {param.status || "Normal"}
                        </span>
                      </div>

                      {/* Value + Unit */}
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className={`text-3xl font-extrabold ${style.valueCls}`}>
                          {param.value}
                        </span>
                        {param.unit && (
                          <span className="text-sm text-gray-500 font-medium">{param.unit}</span>
                        )}
                      </div>

                      {/* Normal Range */}
                      {(param.normalRange || param.normal_range || param.range) && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white bg-opacity-60 rounded-md px-2 py-1 w-fit">
                          <span className="font-medium text-gray-600">Normal:</span>
                          <span>{param.normalRange || param.normal_range || param.range}</span>
                          {/* Unit is already in range_str from backend analyzer.py */}
                        </div>
                      )}

                      {/* Icons row */}
                      <div className="flex gap-1 mt-2">
                        <div className={getStatusColor(param.status)}>
                          {getStatusIcon(param.status)}
                          {getTrendIcon(param.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* CHARTS */}
        {parameters.length > 0 && (() => {
          const categoryConfig = {
            low:      { label: "Low",      color: "#3B82F6", bg: "bg-blue-50",   border: "border-blue-300",   text: "text-blue-700",   badge: "bg-blue-100 text-blue-700"   },
            normal:   { label: "Normal",   color: "#10B981", bg: "bg-green-50",  border: "border-green-300",  text: "text-green-700",  badge: "bg-green-100 text-green-700"  },
            critical: { label: "Critical", color: "#EF4444", bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700",    badge: "bg-red-100 text-red-700"    },
            high:     { label: "High",     color: "#F59E0B", bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" },
          };

          // Group parameters by status
          const grouped = parameters.reduce((acc, param) => {
            const key = (param.status || "normal").toLowerCase();
            const resolvedKey = categoryConfig[key] ? key : "normal";
            if (!acc[resolvedKey]) acc[resolvedKey] = [];
            acc[resolvedKey].push(param);
            return acc;
          }, {});

          // Bar chart data: one bar per parameter, colored by status
          const barData = parameters.map((param) => {
            const key = (param.status || "normal").toLowerCase();
            const resolvedKey = categoryConfig[key] ? key : "normal";
            return {
              name: param.name,
              value: parseFloat(param.value) || 0,
              status: resolvedKey,
              color: categoryConfig[resolvedKey].color,
            };
          });

          return (
            <div className="space-y-6">
              {/* Category Cards */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 text-base">
                  Parameters by Category
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(categoryConfig).map(([key, cfg]) => {
                    const items = grouped[key] || [];
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border-2 p-4 ${cfg.bg} ${cfg.border}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-bold text-sm uppercase tracking-wide ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {items.length}
                          </span>
                        </div>
                        {items.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No parameters</p>
                        ) : (
                          <ul className="space-y-1">
                            {items.map((param, i) => (
                              <li key={i} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 font-medium truncate mr-2">{param.name}</span>
                                <span className={`font-bold text-xs ${cfg.text}`}>{param.value}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-1">Parameter Values Overview</h4>
                <p className="text-xs text-gray-400 mb-4">Bars are color-coded by status category</p>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(categoryConfig).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: cfg.color }} />
                      <span className="text-xs text-gray-600">{cfg.label}</span>
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} (${categoryConfig[props.payload.status]?.label || props.payload.status})`,
                        "Value",
                      ]}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* RECOMMENDATIONS */}
        <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 sm:p-8 mt-8 border border-cyan-100 shadow-inner">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="bg-cyan-100 p-2 rounded-lg mr-3">
              <AlertCircle className="w-6 h-6 text-cyan-600" />
            </div>
            Recommended Next Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <div 
                key={i} 
                className="bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-4 border border-cyan-50 flex items-start space-x-3 hover:shadow-md transition-shadow duration-300"
              >
                <div className="mt-1 flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                    <span className="text-cyan-600 text-xs font-bold">{i + 1}</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm font-medium leading-relaxed">
                  {rec}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <p className="text-xs text-yellow-800 leading-relaxed italic">
              <strong>Disclaimer:</strong> This AI-generated analysis is for informational purposes only and does not constitute medical advice. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>
        </div>

        {/* CHATBOT ASSISTANT */}
        <ChatbotAssistant reportType={report.report_type} />

        {/* ACTIONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={resetReport}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            New Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportSection;