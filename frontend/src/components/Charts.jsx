import React from "react";
import { Activity } from "lucide-react";
import { getBarChartData, getRadarChartData, getStatusDistribution } from "../utils/helpers";
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-teal-200">
        <p className="font-semibold text-gray-800">{payload[0].payload.fullName || label}</p>
        <p className="text-teal-600">Value: {payload[0].value}</p>
        {payload[0].payload.normalMin && <p className="text-gray-600 text-sm">Normal: {payload[0].payload.normalMin} - {payload[0].payload.normalMax}</p>}
      </div>
    );
  }
  return null;
};

const Charts = ({ report }) => (
  <div className="mb-6 space-y-6">
    <h3 className="font-semibold text-gray-800 text-lg flex items-center">
      <Activity className="w-5 h-5 mr-2 text-teal-600 animate-pulse" />
      Visual Health Analysis
    </h3>
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
      <h4 className="font-semibold text-gray-700 mb-4">Parameter Status Distribution</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={getStatusDistribution(report)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {getStatusDistribution(report).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
      <h4 className="font-semibold text-gray-700 mb-4">CBC Parameters Overview</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={getBarChartData(report)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="#6b7280" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {getBarChartData(report).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.status === "normal" ? "#10b981" : entry.status === "low" ? "#f59e0b" : entry.status === "high" ? "#f97316" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
      <h4 className="font-semibold text-gray-700 mb-4">Health Parameters Radar</h4>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={getRadarChartData(report)}>
          <PolarGrid stroke="#d1d5db" />
          <PolarAngleAxis dataKey="parameter" stroke="#6b7280" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
          <Radar name="Current Values" dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 text-center mt-2">Values normalized to 0-100 scale based on normal ranges</p>
    </div>
    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-lg mb-2">Overall Health Score</h4>
          <p className="text-sm opacity-90">Based on CBC parameters within normal range</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold">
            {Math.round((report.parameters.filter((p) => p.status === "normal").length / report.parameters.length) * 100)}%
          </div>
          <p className="text-sm opacity-90">
            {report.parameters.filter((p) => p.status === "normal").length}/{report.parameters.length} Normal
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default Charts;