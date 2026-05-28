import express from 'express';
import { run, query, get } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper: Fetch entire project graph
async function getFullProject(projectId, userId) {
  const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
  if (!project) return null;

  const columns = await query('SELECT * FROM columns WHERE project_id = ? ORDER BY position ASC', [projectId]);
  
  for (const col of columns) {
    const tasks = await query('SELECT * FROM tasks WHERE column_id = ?', [col.id]);
    for (const t of tasks) {
      t.subtasks = await query('SELECT id, text, completed FROM subtasks WHERE task_id = ?', [t.id]);
      t.subtasks = t.subtasks.map(s => ({ ...s, completed: !!s.completed }));
      
      t.comments = await query('SELECT id, user_name as user, text, timestamp FROM comments WHERE task_id = ? ORDER BY timestamp DESC', [t.id]);
    }
    col.tasks = tasks;
  }
  project.columns = columns;
  return project;
}

// 1. Get all projects for logged-in user
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const projectsList = await query('SELECT * FROM projects WHERE user_id = ?', [req.user.id]);
    
    // Fetch details for all projects
    const fullProjects = [];
    for (const proj of projectsList) {
      const full = await getFullProject(proj.id, req.user.id);
      if (full) fullProjects.push(full);
    }
    
    res.json(fullProjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create a new project
router.post('/projects', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const projectId = `p_${Date.now()}`;
  try {
    await run('INSERT INTO projects (id, name, description, user_id) VALUES (?, ?, ?, ?)', [
      projectId,
      name,
      description || 'No description provided.',
      req.user.id
    ]);

    // Create 3 default columns
    const defaultCols = ['To Do', 'In Progress', 'Completed'];
    for (let i = 0; i < defaultCols.length; i++) {
      const colId = `col_${Date.now()}_${i}`;
      await run('INSERT INTO columns (id, project_id, title, position) VALUES (?, ?, ?, ?)', [
        colId,
        projectId,
        defaultCols[i],
        i
      ]);
    }

    const fullProject = await getFullProject(projectId, req.user.id);
    res.status(201).json(fullProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete project
router.delete('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    
    // Broadcast delete event
    const io = req.app.get('socketio');
    if (io) {
      io.emit('project-deleted', { projectId: req.params.id, userId: req.user.id });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Add column
router.post('/projects/:id/columns', authenticateToken, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Column title is required' });

  try {
    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const maxPosRow = await get('SELECT MAX(position) as maxPos FROM columns WHERE project_id = ?', [req.params.id]);
    const position = (maxPosRow.maxPos !== null) ? maxPosRow.maxPos + 1 : 0;
    const colId = `col_${Date.now()}`;

    await run('INSERT INTO columns (id, project_id, title, position) VALUES (?, ?, ?, ?)', [
      colId,
      req.params.id,
      title,
      position
    ]);

    const updatedProject = await getFullProject(req.params.id, req.user.id);
    
    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('board-updated', { projectId: req.params.id, project: updatedProject });
    }

    res.status(201).json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete column
router.delete('/projects/:id/columns/:colId', authenticateToken, async (req, res) => {
  try {
    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await run('DELETE FROM columns WHERE id = ? AND project_id = ?', [req.params.colId, req.params.id]);

    const updatedProject = await getFullProject(req.params.id, req.user.id);
    
    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('board-updated', { projectId: req.params.id, project: updatedProject });
    }

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Add task to column
router.post('/projects/:id/columns/:colId/tasks', authenticateToken, async (req, res) => {
  const { title, description, priority, dueDate, assigneeId } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  try {
    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const taskId = `t_${Date.now()}`;
    await run(`
      INSERT INTO tasks (id, column_id, title, description, priority, due_date, assignee_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [taskId, req.params.colId, title, description || '', priority || 'medium', dueDate || '', assigneeId || '']);

    const updatedProject = await getFullProject(req.params.id, req.user.id);
    
    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('board-updated', { projectId: req.params.id, project: updatedProject });
    }

    res.status(201).json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update task details, subtasks, and comments
router.put('/projects/:id/tasks/:taskId', authenticateToken, async (req, res) => {
  const { title, description, priority, dueDate, assigneeId, subtasks, comments } = req.body;

  try {
    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Update core task info
    if (title) {
      await run(`
        UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, assignee_id = ?
        WHERE id = ?
      `, [title, description || '', priority || 'medium', dueDate || '', assigneeId || '', req.params.taskId]);
    }

    // Sync subtasks
    if (subtasks) {
      // Clean old subtasks
      await run('DELETE FROM subtasks WHERE task_id = ?', [req.params.taskId]);
      for (const s of subtasks) {
        await run('INSERT INTO subtasks (id, task_id, text, completed) VALUES (?, ?, ?, ?)', [
          s.id || `sub_${Date.now()}_${Math.random()}`,
          req.params.taskId,
          s.text,
          s.completed ? 1 : 0
        ]);
      }
    }

    // Sync comments
    if (comments) {
      await run('DELETE FROM comments WHERE task_id = ?', [req.params.taskId]);
      for (const c of comments) {
        await run('INSERT INTO comments (id, task_id, user_name, text, timestamp) VALUES (?, ?, ?, ?, ?)', [
          c.id || `c_${Date.now()}_${Math.random()}`,
          req.params.taskId,
          c.user,
          c.text,
          c.timestamp
        ]);
      }
    }

    const updatedProject = await getFullProject(req.params.id, req.user.id);
    
    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('board-updated', { projectId: req.params.id, project: updatedProject });
    }

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete task
router.delete('/projects/:id/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await run('DELETE FROM tasks WHERE id = ?', [req.params.taskId]);

    const updatedProject = await getFullProject(req.params.id, req.user.id);
    
    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('board-updated', { projectId: req.params.id, project: updatedProject });
    }

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Drag and drop task move
router.put('/projects/:id/tasks/:taskId/move', authenticateToken, async (req, res) => {
  const { sourceColId, destColId } = req.body;
  if (!destColId) return res.status(400).json({ error: 'Destination column is required' });

  try {
    const project = await get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await run('UPDATE tasks SET column_id = ? WHERE id = ?', [destColId, req.params.taskId]);

    const updatedProject = await getFullProject(req.params.id, req.user.id);
    
    // Broadcast updates
    const io = req.app.get('socketio');
    if (io) {
      // Find the task name to send in notifications
      const column = updatedProject.columns.find(c => c.id === destColId);
      const movedTask = column?.tasks.find(t => t.id === req.params.taskId);
      
      io.emit('task-moved', {
        projectId: req.params.id,
        taskId: req.params.taskId,
        taskTitle: movedTask?.title || 'A task',
        destColName: column?.title || 'destination',
        project: updatedProject
      });
    }

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
