import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LogIn, UserPlus, Sparkles, AlertCircle, Shield } from 'lucide-react';
import './Auth.css';

const Auth = () => {
  const { login, register, authError, clearAuthError } = useData();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Developer');
  const [color, setColor] = useState('#8b5cf6');

  const colorsList = [
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#f59e0b', label: 'Amber' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    if (isLogin) {
      login(username, password);
    } else {
      if (!name.trim()) return;
      register({ username, password, name, color, role });
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setPassword('');
    setName('');
    clearAuthError();
  };

  return (
    <div className="auth-wrapper">
      {/* Animated Floating mesh gradient spheres */}
      <div className="bg-mesh-container">
        <div className="bg-mesh-circle circle-1"></div>
        <div className="bg-mesh-circle circle-2"></div>
        <div className="bg-mesh-circle circle-3"></div>
      </div>

      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo">🌌</div>
          <h2 className="auth-title text-gradient">Aether Board</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to access your projects' : 'Create an account to get started'}
          </p>
        </div>

        {authError && (
          <div className="auth-error glass-panel">
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Registration fields */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Professional Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Lead Developer">Lead Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="QA Specialist">QA Specialist</option>
                </select>
              </div>

              <div className="form-group">
                <label>Avatar Theme Glow</label>
                <div className="color-picker-grid">
                  {colorsList.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-choice-btn ${color === c.value ? 'selected' : ''}`}
                      style={{ backgroundColor: c.value, '--glow-color': c.value }}
                      onClick={() => setColor(c.value)}
                      data-tooltip={c.label}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="e.g. sophia" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <button className="auth-toggle-btn" onClick={toggleMode}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        {/* Demo credentials hint */}
        {isLogin && (
          <div className="demo-hint glass-panel">
            <Shield size={14} className="hint-icon" />
            <span>Demo Mode: Login with <strong>demo</strong> / <strong>password</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
