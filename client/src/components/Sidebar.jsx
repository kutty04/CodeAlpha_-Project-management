import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  FolderKanban, 
  BarChart3, 
  Plus, 
  Trash2, 
  FolderPlus,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentView, setCurrentView }) => {
  const { 
    projects, 
    activeProjectId, 
    setActiveProjectId, 
    addProject, 
    deleteProject, 
    teamMembers,
    user,
    logout
  } = useData();

  const [collapsed, setCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    addProject(newProjName, newProjDesc);
    setNewProjName('');
    setNewProjDesc('');
    setShowAddForm(false);
  };

  return (
    <aside className={`sidebar glass-panel ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-btn glass-panel"
        onClick={() => setCollapsed(!collapsed)}
        data-tooltip={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Brand logo */}
      <div className="sidebar-brand">
        <div className="brand-logo">🌌</div>
        {!collapsed && <h2 className="brand-name text-gradient">Aether Board</h2>}
      </div>

      {/* Nav Section */}
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${currentView === 'board' ? 'active' : ''}`}
          onClick={() => setCurrentView('board')}
        >
          <FolderKanban size={20} />
          {!collapsed && <span>Kanban Boards</span>}
        </button>
        <button 
          className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
          onClick={() => setCurrentView('analytics')}
        >
          <BarChart3 size={20} />
          {!collapsed && <span>Analytics</span>}
        </button>
      </nav>

      <div className="divider"></div>

      {/* Projects List */}
      <div className="sidebar-section">
        <div className="section-header">
          {!collapsed && <span className="section-title">Projects</span>}
          <button 
            className="add-project-btn" 
            onClick={() => setShowAddForm(!showAddForm)}
            data-tooltip="Create Project"
          >
            <FolderPlus size={18} />
          </button>
        </div>

        {showAddForm && !collapsed && (
          <form className="add-project-form glass-panel" onSubmit={handleCreateProject}>
            <input 
              type="text" 
              placeholder="Project Name..." 
              value={newProjName}
              onChange={e => setNewProjName(e.target.value)}
              required
              autoFocus
            />
            <textarea 
              placeholder="Description (optional)..." 
              value={newProjDesc}
              onChange={e => setNewProjDesc(e.target.value)}
              rows={2}
            />
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        )}

        <div className="projects-list">
          {projects.map(proj => (
            <div 
              key={proj.id} 
              className={`project-item ${proj.id === activeProjectId ? 'active' : ''}`}
              onClick={() => setActiveProjectId(proj.id)}
            >
              <div className="project-title-wrapper">
                <span className="project-icon">📂</span>
                {!collapsed && <span className="project-name">{proj.name}</span>}
              </div>
              {!collapsed && projects.length > 1 && (
                <button 
                  className="delete-proj-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Are you sure you want to delete "${proj.name}"?`)) {
                      deleteProject(proj.id);
                    }
                  }}
                  data-tooltip="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="divider" style={{ marginTop: 'auto' }}></div>

      {/* Logged in User Profile */}
      {user && (
        <div className="sidebar-profile">
          <div 
            className="user-avatar member-avatar-glow"
            style={{ '--member-color': user.color }}
            data-tooltip={`${user.name} (${user.role})`}
          >
            {user.avatar}
          </div>
          {!collapsed && (
            <div className="user-profile-details">
              <span className="user-profile-name">{user.name}</span>
              <span className="user-profile-role">{user.role}</span>
            </div>
          )}
          {!collapsed && (
            <button 
              className="logout-btn" 
              onClick={logout}
              data-tooltip="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}

      {user && <div className="divider"></div>}

      {/* Team Members List */}
      <div className="sidebar-section team-section">
        {!collapsed && (
          <div className="section-header">
            <span className="section-title"><Users size={16} style={{ marginRight: '6px' }}/>Team</span>
          </div>
        )}
        <div className="team-avatars">
          {teamMembers.map(member => (
            <div 
              key={member.id} 
              className="member-avatar-glow"
              style={{ '--member-color': member.color }}
              data-tooltip={`${member.name} (${member.role})`}
            >
              {member.avatar}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
