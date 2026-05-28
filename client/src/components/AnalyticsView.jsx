import React from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FolderDot
} from 'lucide-react';
import './AnalyticsView.css';

const AnalyticsView = () => {
  const { activeProject } = useData();

  if (!activeProject) {
    return (
      <div className="analytics-empty glass-panel">
        <BarChart3 size={48} className="empty-icon" />
        <h2>No Active Project Selected</h2>
        <p>Go to your boards or select a project from the sidebar to view metrics.</p>
      </div>
    );
  }

  // Calculate Metrics
  const totalTasks = activeProject.columns.reduce((sum, col) => sum + col.tasks.length, 0);
  
  const completedColumn = activeProject.columns.find(col => 
    col.title.toLowerCase().includes('done') || col.title.toLowerCase().includes('completed')
  );
  const completedCount = completedColumn ? completedColumn.tasks.length : 0;
  
  const inProgressColumn = activeProject.columns.find(col => 
    col.title.toLowerCase().includes('progress') || col.title.toLowerCase().includes('active')
  );
  const inProgressCount = inProgressColumn ? inProgressColumn.tasks.length : 0;

  // Urgent tasks
  let urgentCount = 0;
  let priorityStats = { low: 0, medium: 0, high: 0, urgent: 0 };
  
  activeProject.columns.forEach(col => {
    col.tasks.forEach(t => {
      if (t.priority === 'urgent') urgentCount++;
      priorityStats[t.priority] = (priorityStats[t.priority] || 0) + 1;
    });
  });

  // Checklist completion
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  
  activeProject.columns.forEach(col => {
    col.tasks.forEach(t => {
      totalSubtasks += t.subtasks.length;
      completedSubtasks += t.subtasks.filter(s => s.completed).length;
    });
  });

  const subtaskCompletionRate = totalSubtasks > 0 
    ? Math.round((completedSubtasks / totalSubtasks) * 100) 
    : 0;

  const taskCompletionRate = totalTasks > 0 
    ? Math.round((completedCount / totalTasks) * 100) 
    : 0;

  // Donut chart priority variables
  const priorityColors = {
    low: '#10b981',     // Emerald
    medium: '#06b6d4',  // Cyan
    high: '#f59e0b',    // Amber
    urgent: '#ef4444'   // Red
  };

  const totalPriorityCount = Object.values(priorityStats).reduce((a, b) => a + b, 0);

  // SVG Donut Calculations
  let donutSegments = [];
  let currentAngle = 0;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  Object.entries(priorityStats).forEach(([pri, count]) => {
    if (count === 0) return;
    const percentage = count / (totalPriorityCount || 1);
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -currentAngle * circumference;
    
    donutSegments.push({
      priority: pri,
      count,
      color: priorityColors[pri],
      strokeDasharray,
      strokeDashoffset,
      percent: Math.round(percentage * 100)
    });
    
    currentAngle += percentage;
  });

  // SVG Bar Chart Calculations (Columns distribution)
  const chartHeight = 150;
  const chartWidth = 320;
  const barPadding = 24;
  const maxTasksVal = Math.max(...activeProject.columns.map(c => c.tasks.length), 3);
  const barWidth = (chartWidth - barPadding * (activeProject.columns.length + 1)) / activeProject.columns.length;

  return (
    <div className="analytics-container">
      {/* Overview Cards Row */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: 'var(--color-primary)' }}>
            <FolderDot size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Tasks</span>
            <span className="metric-value">{totalTasks}</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Completed</span>
            <span className="metric-value">{completedCount} <span className="metric-subval">({taskCompletionRate}%)</span></span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', color: 'var(--color-info)' }}>
            <Clock size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">In Progress</span>
            <span className="metric-value">{inProgressCount}</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-wrap" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-danger)' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Urgent Priority</span>
            <span className="metric-value">{urgentCount}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Column Distribution Bar Chart */}
        <div className="chart-card glass-panel">
          <h3 className="chart-title">Tasks by Board Column</h3>
          {totalTasks === 0 ? (
            <div className="chart-empty">No tasks to chart. Add some tasks first.</div>
          ) : (
            <div className="bar-chart-wrapper">
              <svg viewBox={`0 0 ${chartWidth} 200`} className="bar-chart-svg">
                {/* Horizontal grid lines */}
                {[0, 0.5, 1].map((r, i) => {
                  const y = 30 + r * chartHeight;
                  const label = Math.round(maxTasksVal * (1 - r));
                  return (
                    <g key={i} className="chart-grid-line">
                      <line x1="30" y1={y} x2={chartWidth - 10} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      <text x="5" y={y + 4} fill="var(--text-muted)" fontSize="9" fontWeight="600">{label}</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {activeProject.columns.map((col, index) => {
                  const val = col.tasks.length;
                  const percentOfMax = val / maxTasksVal;
                  const barHeight = percentOfMax * chartHeight;
                  const x = barPadding + index * (barWidth + barPadding) + 20;
                  const y = 30 + chartHeight - barHeight;

                  return (
                    <g key={col.id} className="bar-group">
                      {/* Bar Background shadow */}
                      <rect 
                        x={x} 
                        y={30} 
                        width={barWidth} 
                        height={chartHeight} 
                        fill="rgba(255,255,255,0.01)" 
                        rx="4" 
                      />
                      {/* Filled Bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        fill="url(#barGradient)" 
                        rx="4" 
                        className="bar-rect"
                      />
                      {/* Text value atop bar */}
                      {val > 0 && (
                        <text x={x + barWidth/2} y={y - 8} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">
                          {val}
                        </text>
                      )}
                      {/* Column label below bar */}
                      <text 
                        x={x + barWidth/2} 
                        y={30 + chartHeight + 20} 
                        textAnchor="middle" 
                        fill="var(--text-secondary)" 
                        fontSize="9.5" 
                        fontWeight="600"
                        className="bar-label"
                      >
                        {col.title.length > 10 ? col.title.slice(0, 8) + '..' : col.title}
                      </text>
                    </g>
                  );
                })}

                {/* SVG definitions */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>

        {/* Priority Split Donut Chart */}
        <div className="chart-card glass-panel">
          <h3 className="chart-title">Tasks by Priority</h3>
          {totalTasks === 0 ? (
            <div className="chart-empty">No tasks to chart. Add some tasks first.</div>
          ) : (
            <div className="donut-chart-layout">
              <div className="donut-chart-wrapper">
                <svg viewBox="0 0 140 140" className="donut-chart-svg">
                  <circle 
                    cx="70" 
                    cy="70" 
                    r={radius} 
                    fill="transparent" 
                    stroke="rgba(255,255,255,0.02)" 
                    strokeWidth={strokeWidth} 
                  />
                  {donutSegments.map((seg, i) => (
                    <circle 
                      key={i}
                      cx="70" 
                      cy="70" 
                      r={radius} 
                      fill="transparent" 
                      stroke={seg.color} 
                      strokeWidth={strokeWidth} 
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      transform="rotate(-90 70 70)"
                      className="donut-segment"
                    />
                  ))}
                  <g className="donut-center-text">
                    <text x="70" y="66" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontWeight="600" letterSpacing="0.5">TOTAL</text>
                    <text x="70" y="84" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800">{totalTasks}</text>
                  </g>
                </svg>
              </div>

              {/* Legend */}
              <div className="donut-legend">
                {donutSegments.map((seg, i) => (
                  <div key={i} className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: seg.color }}></div>
                    <span className="legend-label">{seg.priority}</span>
                    <span className="legend-value">{seg.count} <span className="legend-sub">({seg.percent}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className="progress-section glass-panel">
        <h3 className="chart-title">Subtask Checklist Analytics</h3>
        <div className="progress-bar-container">
          <div className="progress-bar-labels">
            <span className="progress-label-main">Checklist Completion Rate</span>
            <span className="progress-rate-percent">{subtaskCompletionRate}%</span>
          </div>
          <div className="analytics-progress-bg">
            <div className="analytics-progress-fill" style={{ width: `${subtaskCompletionRate}%` }}></div>
          </div>
          <div className="progress-sub-details">
            <span>Completed <strong>{completedSubtasks}</strong> subtasks out of <strong>{totalSubtasks}</strong> total.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
