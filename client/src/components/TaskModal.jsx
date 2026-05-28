import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { 
  X, 
  Calendar, 
  User, 
  AlertCircle, 
  ListTodo, 
  MessageSquare, 
  Plus, 
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import './TaskModal.css';

const TaskModal = ({ taskId, onClose, colIdForNewTask }) => {
  const { 
    activeProject, 
    teamMembers, 
    updateTask, 
    deleteTask, 
    addTask 
  } = useData();

  const isNewTask = !taskId;
  
  // Find task if editing
  const getTask = () => {
    if (isNewTask) return null;
    for (const col of activeProject.columns) {
      const found = col.tasks.find(t => t.id === taskId);
      if (found) return { found, colId: col.id };
    }
    return null;
  };

  const taskInfo = getTask();
  const task = taskInfo?.found;
  const colId = taskInfo?.colId || colIdForNewTask || activeProject.columns[0]?.id;

  // Local component states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  
  // Subtasks and comments states
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentUser, setCommentUser] = useState('m1'); // default to Sophia Patel

  // Sync state if editing existing task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setDueDate(task.dueDate || '');
      setAssigneeId(task.assigneeId || '');
      setSubtasks(task.subtasks || []);
      setComments(task.comments || []);
    } else {
      // Default new task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssigneeId('');
      setSubtasks([]);
      setComments([]);
    }
  }, [task, taskId]);

  const handleSave = () => {
    if (!title.trim()) return;

    const data = {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
      subtasks,
      comments
    };

    if (isNewTask) {
      addTask(colId, data);
    } else {
      updateTask(taskId, data);
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
      onClose();
    }
  };

  // Subtask Handlers
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSub = {
      id: `sub_${Date.now()}`,
      text: newSubtaskText,
      completed: false
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskText('');
    
    // Save live if existing task
    if (!isNewTask) {
      updateTask(taskId, { subtasks: updated });
    }
  };

  const handleToggleSubtask = (subId) => {
    const updated = subtasks.map(s => {
      if (s.id === subId) return { ...s, completed: !s.completed };
      return s;
    });
    setSubtasks(updated);
    if (!isNewTask) {
      updateTask(taskId, { subtasks: updated });
    }
  };

  const handleDeleteSubtask = (subId) => {
    const updated = subtasks.filter(s => s.id !== subId);
    setSubtasks(updated);
    if (!isNewTask) {
      updateTask(taskId, { subtasks: updated });
    }
  };

  // Comment Handlers
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const userObj = teamMembers.find(m => m.id === commentUser);
    const newComment = {
      id: `c_${Date.now()}`,
      user: userObj?.name || 'Anonymous User',
      text: newCommentText,
      timestamp: new Date().toISOString()
    };
    
    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText('');

    if (!isNewTask) {
      updateTask(taskId, { comments: updated });
    }
  };

  const formatCommentTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' @ ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Close header */}
        <div className="modal-header">
          <h3 className="modal-headline text-gradient">
            {isNewTask ? '➕ New Card Details' : '📝 Card Editor'}
          </h3>
          <button className="close-modal-btn glass-panel" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Main content left side */}
          <div className="modal-main">
            <div className="form-group">
              <label>Task Title</label>
              <input 
                type="text" 
                className="input-title"
                placeholder="Enter task title..." 
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                placeholder="Add details for this task..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Checklist section */}
            <div className="modal-section subtasks-section">
              <h4 className="section-title">
                <ListTodo size={16} />
                <span>Checklist / Subtasks</span>
              </h4>

              <div className="subtasks-list-modal">
                {subtasks.map(s => (
                  <div key={s.id} className={`subtask-item ${s.completed ? 'completed' : ''}`}>
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={s.completed}
                        onChange={() => handleToggleSubtask(s.id)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="subtask-text">{s.text}</span>
                    </label>
                    <button className="delete-subtask-btn" onClick={() => handleDeleteSubtask(s.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form className="add-subtask-form" onSubmit={handleAddSubtask}>
                <input 
                  type="text" 
                  placeholder="Add a checklist item..." 
                  value={newSubtaskText}
                  onChange={e => setNewSubtaskText(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary btn-icon">
                  <Plus size={16} />
                </button>
              </form>
            </div>

            {/* Comments Feed (only show if not creating a new card, or keep comments local) */}
            <div className="modal-section comments-section">
              <h4 className="section-title">
                <MessageSquare size={16} />
                <span>Discussion & Comments</span>
              </h4>

              <form className="add-comment-form" onSubmit={handleAddComment}>
                <div className="comment-user-select">
                  <span className="user-icon-label"><User size={14} /> Comment as:</span>
                  <select value={commentUser} onChange={e => setCommentUser(e.target.value)}>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="comment-input-wrapper">
                  <textarea 
                    placeholder="Write a comment..." 
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    rows={2}
                  />
                  <button type="submit" className="btn btn-primary">Post</button>
                </div>
              </form>

              <div className="comments-list">
                {comments.slice().reverse().map(c => (
                  <div key={c.id} className="comment-item glass-panel">
                    <div className="comment-meta">
                      <span className="comment-author">{c.user}</span>
                      <span className="comment-time">
                        <Clock size={10} style={{ marginRight: '4px' }} />
                        {formatCommentTime(c.timestamp)}
                      </span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side settings panel */}
          <div className="modal-sidebar">
            <div className="form-group">
              <label><User size={14} style={{ marginRight: '6px' }}/> Assignee</label>
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><AlertCircle size={14} style={{ marginRight: '6px' }}/> Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label><Calendar size={14} style={{ marginRight: '6px' }}/> Due Date</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            <div className="sidebar-actions">
              <button className="btn btn-primary w-full" onClick={handleSave}>
                Save Changes
              </button>
              
              {!isNewTask && (
                <button className="btn btn-danger w-full" onClick={handleDelete}>
                  <Trash2 size={16} />
                  <span>Delete Card</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
