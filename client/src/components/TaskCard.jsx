import React from 'react';
import { useData } from '../context/DataContext';
import { Calendar, CheckSquare, MessageSquare } from 'lucide-react';
import './TaskCard.css';

const TaskCard = ({ task, onClick }) => {
  const { teamMembers } = useData();
  const assignee = teamMembers.find(m => m.id === task.assigneeId);

  // Subtask calculations
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Format date readable
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      className={`task-card glass-panel glass-panel-hover priority-${task.priority}`} 
      onClick={onClick}
    >
      {/* Priority tag */}
      <div className="card-top">
        <span className={`priority-tag tag-${task.priority}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="due-date-badge">
            <Calendar size={12} />
            <span>{formatDate(task.dueDate)}</span>
          </span>
        )}
      </div>

      {/* Title & Desc */}
      <h4 className="card-title">{task.title}</h4>
      {task.description && <p className="card-desc">{task.description}</p>}

      {/* Progress Bar (if subtasks exist) */}
      {totalSubtasks > 0 && (
        <div className="card-progress">
          <div className="progress-text-wrapper">
            <span className="progress-icon-label">
              <CheckSquare size={12} />
              <span>Subtasks</span>
            </span>
            <span className="progress-fraction">{completedSubtasks}/{totalSubtasks}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      )}

      {/* Footer (Comments count & Assignee avatar) */}
      <div className="card-footer">
        <div className="card-indicators">
          {task.comments.length > 0 && (
            <div className="comment-indicator" data-tooltip="Comments">
              <MessageSquare size={14} />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        {assignee && (
          <div 
            className="assignee-avatar" 
            style={{ '--member-color': assignee.color }}
            data-tooltip={`Assigned to ${assignee.name}`}
          >
            {assignee.avatar}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
