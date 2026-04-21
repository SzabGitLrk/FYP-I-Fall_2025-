import { Target, Fish, BarChart3, TrendingUp } from 'lucide-react';
import { useDetectionHistory } from '../hooks/useDetectionHistory';
import StatsCard from '../components/Dashboard/StatsCard';
import SpeciesPieChart from '../components/Dashboard/SpeciesPieChart';
import ActivityBarChart from '../components/Dashboard/ActivityBarChart';
import RecentDetections from '../components/Dashboard/RecentDetections';

const CARD = 'bg-[#0d1f35] rounded-2xl border border-sky-400/20';

export default function DashboardPage() {
  const { history, stats } = useDetectionHistory();

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400 text-sm">Track your detection activity and analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard icon={Target}    label="Total Detections"  value={stats.totalDetections}      colorScheme="teal" />
        <StatsCard icon={Fish}      label="Successful"        value={stats.successfulDetections}  colorScheme="blue" />
        <StatsCard icon={BarChart3} label="Unique Species"    value={stats.uniqueSpecies}         colorScheme="purple" />
        <StatsCard icon={TrendingUp}label="Avg Confidence"    value={stats.averageConfidence} suffix="%" colorScheme="yellow" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <div className={`${CARD} p-6`}>
          <h3 className="text-white font-semibold mb-1">Species Distribution</h3>
          <p className="text-slate-500 text-xs mb-4">All-time detection breakdown</p>
          <SpeciesPieChart data={stats.speciesDistribution} />
        </div>
        <div className={`${CARD} p-6`}>
          <h3 className="text-white font-semibold mb-1">Weekly Activity</h3>
          <p className="text-slate-500 text-xs mb-4">Detections over the last 7 days</p>
          <ActivityBarChart data={stats.weeklyActivity} />
        </div>
      </div>

      {/* Recent */}
      <div className={`${CARD} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Recent Detections</h3>
            <p className="text-slate-500 text-xs mt-0.5">Your last {Math.min(5, history.length)} detections</p>
          </div>
          {history.length > 5 && (
            <a href="/history" className="text-teal-400 hover:text-teal-300 text-xs transition-colors">View all →</a>
          )}
        </div>
        <RecentDetections detections={history} limit={5} />
      </div>
    </div>
  );
}
