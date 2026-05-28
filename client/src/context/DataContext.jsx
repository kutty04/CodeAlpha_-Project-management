import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const DataContext = createContext(null);

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const DEFAULT_MEMBERS = [
  { id: 'm1', name: 'Sophia Patel', avatar: 'SP', color: '#06b6d4', role: 'Lead Developer' },
  { id: 'm2', name: 'Alex Carter', avatar: 'AC', color: '#ec4899', role: 'UI/UX Designer' },
  { id: 'm3', name: 'Marcus Vance', avatar: 'MV', color: '#10b981', role: 'Backend Engineer' },
  { id: 'm4', name: 'Elena Rostova', avatar: 'ER', color: '#f59e0b', role: 'QA Lead' },
  { id: 'u_demo', name: 'Demo Manager', avatar: 'DM', color: '#8b5cf6', role: 'Project Manager' }
];

export const DataProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('glass_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('glass_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [teamMembers, setTeamMembers] = useState(DEFAULT_MEMBERS);
  const [authError, setAuthError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Toast helper
  const addNotification = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setNotifications(prev => [...prev, { id, text, type }]);
    
    // Auto-remove notification after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // Fetch helper with auth header
  const fetchAPI = useCallback(async (endpoint, method = 'GET', body = null) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers
    };
    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }, [token]);

  // Load Projects
  const loadProjects = useCallback(async () => {
    if (!token) return;
    try {
      const projs = await fetchAPI('/tasks/projects');
      setProjects(projs);
      if (projs.length > 0) {
        // Recover active project or default to first
        const savedActive = localStorage.getItem('glass_pm_active_project');
        const exists = projs.some(p => p.id === savedActive);
        setActiveProjectId(exists ? savedActive : projs[0].id);
      } else {
        setActiveProjectId(null);
      }
    } catch (err) {
      console.error('Failed to load projects', err.message);
    }
  }, [token, fetchAPI]);

  // Handle Websocket Connections
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSockets server');
    });

    // Handle updates from other users
    newSocket.on('board-updated', ({ projectId, project }) => {
      setProjects(prev => prev.map(p => p.id === projectId ? project : p));
      if (projectId === activeProjectId) {
        addNotification(`Board layout updated by another user`, 'info');
      }
    });

    newSocket.on('task-moved', ({ projectId, taskTitle, destColName, project }) => {
      setProjects(prev => prev.map(p => p.id === projectId ? project : p));
      addNotification(`Task "${taskTitle}" moved to "${destColName}"`, 'success');
    });

    newSocket.on('project-deleted', ({ projectId, userId }) => {
      if (userId !== user.id) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        addNotification('A project was deleted by its manager', 'warning');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, activeProjectId, addNotification]);

  // Join WebSocket room for active project
  useEffect(() => {
    if (socket && activeProjectId) {
      socket.emit('join-project', activeProjectId);
    }
  }, [socket, activeProjectId]);

  // Fetch projects on login
  useEffect(() => {
    if (token) {
      loadProjects();
    } else {
      setProjects([]);
      setActiveProjectId(null);
    }
  }, [token, loadProjects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Save active project in localstorage for recovery
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('glass_pm_active_project', activeProjectId);
    }
  }, [activeProjectId]);

  // Auth: Login
  const login = async (username, password) => {
    setAuthError(null);
    try {
      const data = await fetchAPI('/auth/login', 'POST', { username, password });
      localStorage.setItem('glass_token', data.token);
      localStorage.setItem('glass_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      addNotification(`Welcome back, ${data.user.name}!`, 'success');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Auth: Register
  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await fetchAPI('/auth/register', 'POST', userData);
      localStorage.setItem('glass_token', data.token);
      localStorage.setItem('glass_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      addNotification(`Account created! Welcome, ${data.user.name}`, 'success');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Auth: Logout
  const logout = () => {
    localStorage.removeItem('glass_token');
    localStorage.removeItem('glass_user');
    localStorage.removeItem('glass_pm_active_project');
    setToken(null);
    setUser(null);
    setProjects([]);
    setActiveProjectId(null);
    addNotification('Logged out successfully', 'info');
  };

  const clearAuthError = () => setAuthError(null);

  // Add Project
  const addProject = async (name, description) => {
    try {
      const newProj = await fetchAPI('/tasks/projects', 'POST', { name, description });
      setProjects(prev => [...prev, newProj]);
      setActiveProjectId(newProj.id);
      addNotification(`Project "${name}" created!`, 'success');
    } catch (err) {
      addNotification('Failed to create project', 'danger');
    }
  };

  // Delete Project
  const deleteProject = async (projId) => {
    try {
      await fetchAPI(`/tasks/projects/${projId}`, 'DELETE');
      setProjects(prev => {
        const filtered = prev.filter(p => p.id !== projId);
        if (activeProjectId === projId && filtered.length > 0) {
          setActiveProjectId(filtered[0].id);
        } else if (filtered.length === 0) {
          setActiveProjectId(null);
        }
        return filtered;
      });
      addNotification('Project deleted', 'warning');
    } catch (err) {
      addNotification('Failed to delete project', 'danger');
    }
  };

  // Add Column
  const addColumn = async (title) => {
    try {
      const updated = await fetchAPI(`/tasks/projects/${activeProjectId}/columns`, 'POST', { title });
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updated : p));
      addNotification(`Column "${title}" added`, 'success');
    } catch (err) {
      addNotification('Failed to add column', 'danger');
    }
  };

  // Delete Column
  const deleteColumn = async (colId) => {
    try {
      const updated = await fetchAPI(`/tasks/projects/${activeProjectId}/columns/${colId}`, 'DELETE');
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updated : p));
      addNotification('Column deleted', 'warning');
    } catch (err) {
      addNotification('Failed to delete column', 'danger');
    }
  };

  // Add Task
  const addTask = async (colId, taskData) => {
    try {
      const updated = await fetchAPI(`/tasks/projects/${activeProjectId}/columns/${colId}/tasks`, 'POST', taskData);
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updated : p));
      addNotification(`Task "${taskData.title}" created`, 'success');
    } catch (err) {
      addNotification('Failed to add task', 'danger');
    }
  };

  // Update Task details
  const updateTask = async (taskId, updatedFields) => {
    try {
      const updated = await fetchAPI(`/tasks/projects/${activeProjectId}/tasks/${taskId}`, 'PUT', updatedFields);
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updated : p));
    } catch (err) {
      addNotification('Failed to update task', 'danger');
    }
  };

  // Delete Task
  const deleteTask = async (taskId) => {
    try {
      const updated = await fetchAPI(`/tasks/projects/${activeProjectId}/tasks/${taskId}`, 'DELETE');
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updated : p));
      addNotification('Task deleted', 'warning');
    } catch (err) {
      addNotification('Failed to delete task', 'danger');
    }
  };

  // Move Task (Drag and drop)
  const moveTask = async (taskId, sourceColId, destColId) => {
    // Optimistic UI updates
    let originalProjects = [...projects];
    
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      let draggedTask = null;
      const newColumns = p.columns.map(col => {
        if (col.id === sourceColId) {
          draggedTask = col.tasks.find(t => t.id === taskId);
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
        }
        return col;
      });
      if (!draggedTask) return p;
      return {
        ...p,
        columns: newColumns.map(col => {
          if (col.id === destColId) {
            return { ...col, tasks: [...col.tasks, draggedTask] };
          }
          return col;
        })
      };
    }));

    try {
      const updated = await fetchAPI(`/tasks/projects/${activeProjectId}/tasks/${taskId}/move`, 'PUT', { sourceColId, destColId });
      setProjects(prev => prev.map(p => p.id === activeProjectId ? updated : p));
    } catch (err) {
      // Revert if API fails
      setProjects(originalProjects);
      addNotification('Failed to save task move', 'danger');
    }
  };

  return (
    <DataContext.Provider value={{
      token,
      user,
      projects,
      activeProject,
      activeProjectId,
      setActiveProjectId,
      teamMembers,
      authError,
      notifications,
      login,
      register,
      logout,
      clearAuthError,
      addProject,
      deleteProject,
      addColumn,
      deleteColumn,
      addTask,
      updateTask,
      deleteTask,
      moveTask
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
