import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import TaskCard from './TaskCard';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';
import './BoardView.css';

const BoardView = ({ searchQuery, onTaskClick, onAddTaskClick }) => {
  const { activeProject, addColumn, deleteColumn, moveTask } = useData();
  const [newColTitle, setNewColTitle] = useState('');
  const [showAddCol, setShowAddCol] = useState(false);
  const [dragOverColId, setDragOverColId] = useState(null);

  if (!activeProject) {
    return (
      <div className="empty-board glass-panel">
        <LayoutGrid size={48} className="empty-icon" />
        <h2>No Active Project</h2>
        <p>Select or create a project from the sidebar to get started.</p>
      </div>
    );
  }

  const handleAddColSubmit = (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    addColumn(newColTitle);
    setNewColTitle('');
    setShowAddCol(false);
  };

  // HTML5 Drag and Drop events
  const handleDragStart = (e, taskId, colId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.setData('sourceColId', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = (e, destColId) => {
    e.preventDefault();
    setDragOverColId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const sourceColId = e.dataTransfer.getData('sourceColId');

    if (sourceColId !== destColId) {
      moveTask(taskId, sourceColId, destColId);
    }
  };

  return (
    <div className="board-container">
      <div className="board-columns">
        {activeProject.columns.map(col => {
          // Filter tasks based on search query
          const filteredTasks = col.tasks.filter(t => {
            const matchesTitle = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDesc = t.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTitle || matchesDesc;
          });

          return (
            <div 
              key={col.id} 
              className={`board-column glass-panel ${dragOverColId === col.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="column-header">
                <div className="column-title-wrapper">
                  <h3 className="column-title">{col.title}</h3>
                  <span className="column-count glass-panel">{filteredTasks.length}</span>
                </div>
                <button 
                  className="delete-col-btn"
                  onClick={() => {
                    if (confirm(`Delete column "${col.title}"? All tasks inside will be lost.`)) {
                      deleteColumn(col.id);
                    }
                  }}
                  data-tooltip="Delete Column"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Column Tasks List */}
              <div className="tasks-list">
                {filteredTasks.map((task, index) => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id, col.id)}
                  >
                    <TaskCard 
                      task={task} 
                      onClick={() => onTaskClick(task.id)} 
                    />
                  </div>
                ))}
                
                {filteredTasks.length === 0 && (
                  <div className="empty-column-placeholder">
                    <span>Drop tasks here</span>
                  </div>
                )}
              </div>

              {/* Add Task Quick Trigger */}
              <button 
                className="add-task-quick-btn" 
                onClick={() => onAddTaskClick(col.id)}
              >
                <Plus size={16} />
                <span>Add Card</span>
              </button>
            </div>
          );
        })}

        {/* New Column Form Button */}
        <div className="add-column-wrapper">
          {showAddCol ? (
            <form className="add-column-form glass-panel" onSubmit={handleAddColSubmit}>
              <input 
                type="text" 
                placeholder="Column Title..." 
                value={newColTitle}
                onChange={e => setNewColTitle(e.target.value)}
                required
                autoFocus
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCol(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </form>
          ) : (
            <button className="add-column-btn glass-panel glass-panel-hover" onClick={() => setShowAddCol(true)}>
              <Plus size={20} />
              <span>Add Column</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardView;
