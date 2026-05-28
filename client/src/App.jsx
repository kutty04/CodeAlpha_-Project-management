import React, { useState } from 'react';
import { useData } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BoardView from './components/BoardView';
import AnalyticsView from './components/AnalyticsView';
import TaskModal from './components/TaskModal';
import Auth from './components/Auth';
import './App.css';

function App() {
  const { activeProject, token, user, notifications } = useData();
  const [currentView, setCurrentView] = useState('board'); // 'board' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [colIdForNewTask, setColIdForNewTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setColIdForNewTask(null);
    setShowModal(true);
  };

  const handleAddTaskClick = (colId = null) => {
    setSelectedTaskId(null);
    setColIdForNewTask(colId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedTaskId(null);
    setColIdForNewTask(null);
    setShowModal(false);
  };

  if (!token || !user) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      {/* Animated Glowing Background spheres */}
      <div className="bg-mesh-container">
        <div className="bg-mesh-circle circle-1"></div>
        <div className="bg-mesh-circle circle-2"></div>
        <div className="bg-mesh-circle circle-3"></div>
      </div>

      {/* Floating Notifications Toast alert feed */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className={`toast-card glass-panel toast-${n.type}`}>
            <div className="toast-bullet"></div>
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />

      {/* Main Workspace Frame */}
      <main className="main-content">
        {currentView === 'board' ? (
          <>
            <Header 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddTaskClick={() => handleAddTaskClick()}
            />
            <BoardView 
              searchQuery={searchQuery}
              onTaskClick={handleTaskClick}
              onAddTaskClick={handleAddTaskClick}
            />
          </>
        ) : (
          <AnalyticsView />
        )}
      </main>

      {/* Floating detail popup */}
      {showModal && (
        <TaskModal 
          taskId={selectedTaskId}
          colIdForNewTask={colIdForNewTask}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;
