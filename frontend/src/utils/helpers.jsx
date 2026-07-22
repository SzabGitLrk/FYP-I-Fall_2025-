import { CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Helper functions for status, icons, and chart data
export const getStatusColor = (status) => {
  switch (status) {
    case "normal": return "text-green-600";
    case "low": return "text-yellow-600";
    case "high": return "text-orange-600";
    case "critical": return "text-red-600";
    default: return "text-gray-600";
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case "normal": return <CheckCircle className="w-5 h-5" />;
    case "low":
    case "high": return <AlertCircle className="w-5 h-5" />;
    case "critical": return <XCircle className="w-5 h-5" />;
    default: return null;
  }
};

export const getTrendIcon = (status) => {
  switch (status) {
    case "low": return <TrendingDown className="w-4 h-4" />;
    case "high": return <TrendingUp className="w-4 h-4" />;
    case "normal": return <Minus className="w-4 h-4" />;
    default: return null;
  }
};

export const getBarChartData = (report) => {
  if (!report) return [];
  return report.parameters.map((param) => ({
    name: param.name.length > 10 ? param.name.substring(0, 10) + "..." : param.name,
    fullName: param.name,
    value: param.value,
    normalMin: param.normalMin,
    normalMax: param.normalMax,
    status: param.status,
  }));
};

export const getRadarChartData = (report) => {
  if (!report) return [];
  return report.parameters.map((param) => {
    const range = param.normalMax - param.normalMin;
    const normalizedValue = ((param.value - param.normalMin) / range) * 100;
    return {
      parameter: param.name.length > 8 ? param.name.substring(0, 8) + "..." : param.name,
      value: Math.max(0, Math.min(100, normalizedValue)),
      fullMark: 100,
    };
  });
};

export const getStatusDistribution = (report) => {
  if (!report) return [];
  const statusCounts = { normal: 0, low: 0, high: 0, critical: 0, missing: 0 };
  report.parameters.forEach((param) => {
    if (statusCounts[param.status] !== undefined) {
      statusCounts[param.status]++;
    } else {
      statusCounts.missing++;
    }
  });
  return [
    { name: "Normal", value: statusCounts.normal, color: "#10b981" },
    { name: "Low", value: statusCounts.low, color: "#f59e0b" },
    { name: "High", value: statusCounts.high, color: "#f97316" },
    { name: "Critical", value: statusCounts.critical, color: "#ef4444" },
  ].filter((item) => item.value > 0);
};