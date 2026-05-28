import React from 'react';
import { useData } from '../context/DataContext';
import { Search, Sparkles, Plus } from 'lucide-react';
import './Header.css';

const Header = ({ searchQuery, setSearchQuery, onAddTaskClick }) => {
  const { activeProject } = useData();

  if (!activeProject) return null;

  // Calculate quick metrics
  const totalTasks = activeProject.columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const completedTasks = activeProject.columns.find(col => col.title.toLowerCase().includes('done') || col.title.toLowerCase().includes('completed'))?.tasks.length || 0;

  return (
    <header className="header glass-panel">
      <div className="header-info">
        <h1 className="project-title text-gradient">{activeProject.name}</h1>
        <p className="project-desc">{activeProject.description}</p>
      </div>

      <div className="header-actions">
        {/* Search */}
        <div className="search-bar glass-panel">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick stats glass chip */}
        <div className="stats-chip glass-panel">
          <div className="stat-item">
            <span className="stat-val">{totalTasks}</span>
            <span className="stat-label">Tasks</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-val">{completedTasks}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        {/* Add task shortcut */}
        <button className="btn btn-primary" onClick={onAddTaskClick}>
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
