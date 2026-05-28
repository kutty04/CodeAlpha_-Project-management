import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initDb();
  }
});

// Helper for wrapping sqlite queries in promises
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

function initDb() {
  db.serialize(async () => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        avatar TEXT,
        color TEXT,
        role TEXT
      )
    `);

    // Create Projects Table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_id TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create Columns Table
    db.run(`
      CREATE TABLE IF NOT EXISTS columns (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        title TEXT NOT NULL,
        position INTEGER,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create Tasks Table
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        column_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT,
        due_date TEXT,
        assignee_id TEXT,
        FOREIGN KEY(column_id) REFERENCES columns(id) ON DELETE CASCADE
      )
    `);

    // Create Subtasks Table
    db.run(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Create Comments Table
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        user_name TEXT,
        text TEXT NOT NULL,
        timestamp TEXT,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Seed mock team users (without passwords, they are for assignments)
    // We will insert mock members SP, AC, MV, ER
    const teamMembers = [
      { id: 'm1', username: 'sophia', name: 'Sophia Patel', avatar: 'SP', color: '#06b6d4', role: 'Lead Developer' },
      { id: 'm2', username: 'alex', name: 'Alex Carter', avatar: 'AC', color: '#ec4899', role: 'UI/UX Designer' },
      { id: 'm3', username: 'marcus', name: 'Marcus Vance', avatar: 'MV', color: '#10b981', role: 'Backend Engineer' },
      { id: 'm4', username: 'elena', name: 'Elena Rostova', avatar: 'ER', color: '#f59e0b', role: 'QA Lead' }
    ];

    for (const member of teamMembers) {
      db.run(`
        INSERT OR IGNORE INTO users (id, username, password, name, avatar, color, role)
        VALUES (?, ?, NULL, ?, ?, ?, ?)
      `, [member.id, member.username, member.name, member.avatar, member.color, member.role]);
    }

    // Seed Demo Manager user (username: demo, password: password)
    db.run(`
      INSERT OR IGNORE INTO users (id, username, password, name, avatar, color, role)
      VALUES ('u_demo', 'demo', '$2a$10$T2EiTWGLexdFvuGNiA7q7uPcR.Md68Y6D69WNr3lDJAeD4s7il9/W', 'Demo Manager', 'DM', '#8b5cf6', 'Project Manager')
    `);

    // Check if projects exist, if not seed default data for demo user
    db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
      if (err) {
        console.error('Error counting projects', err.message);
        return;
      }
      if (row.count === 0) {
        console.log('Seeding default placeholder projects...');
        seedDefaultData();
      }
    });

    console.log('Database initialized successfully.');
  });
}

function seedDefaultData() {
  db.serialize(() => {
    // Project 1
    db.run(`
      INSERT INTO projects (id, name, description, user_id)
      VALUES ('p1', '🚀 Glassmorphic Redesign', 'Migration of core user dashboard to the new premium glassmorphic UI design system.', 'u_demo')
    `);

    // Columns Project 1
    db.run("INSERT INTO columns (id, project_id, title, position) VALUES ('col1', 'p1', 'Backlog', 0)");
    db.run("INSERT INTO columns (id, project_id, title, position) VALUES ('col2', 'p1', 'In Progress', 1)");
    db.run("INSERT INTO columns (id, project_id, title, position) VALUES ('col3', 'p1', 'Review', 2)");
    db.run("INSERT INTO columns (id, project_id, title, position) VALUES ('col4', 'p1', 'Completed', 3)");

    // Tasks Column 1 (Backlog)
    db.run(`
      INSERT INTO tasks (id, column_id, title, description, priority, due_date, assignee_id)
      VALUES ('t1', 'col1', 'Design glassmorphism color palette', 'Define semantic dark-theme colors, border gradients, and blur properties in index.css.', 'high', '2026-06-02', 'm2')
    `);
    db.run(`
      INSERT INTO tasks (id, column_id, title, description, priority, due_date, assignee_id)
      VALUES ('t2', 'col1', 'Configure automated ESLint & Vitest', 'Set up testing pipelines and syntax standards before starting work on complex modules.', 'low', '2026-06-15', 'm3')
    `);

    // Tasks Column 2 (In Progress)
    db.run(`
      INSERT INTO tasks (id, column_id, title, description, priority, due_date, assignee_id)
      VALUES ('t3', 'col2', 'Implement custom HTML5 Drag & Drop', 'Build robust Kanban columns utilizing HTML5 Drag and Drop events. Add smooth scale animations and tilt on drag.', 'urgent', '2026-05-30', 'm1')
    `);

    // Tasks Column 3 (Review)
    db.run(`
      INSERT INTO tasks (id, column_id, title, description, priority, due_date, assignee_id)
      VALUES ('t4', 'col3', 'Develop SVG Chart Dashboard', 'Create interactive custom SVG charts for the dashboard view to display task count and priority breakdowns without adding large package payloads.', 'medium', '2026-05-28', 'm2')
    `);

    // Tasks Column 4 (Completed)
    db.run(`
      INSERT INTO tasks (id, column_id, title, description, priority, due_date, assignee_id)
      VALUES ('t5', 'col4', 'Vite React scaffolding', 'Create standard project structure and clean up default assets.', 'low', '2026-05-26', 'm3')
    `);

    // Subtasks
    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s1_1', 't1', 'Select base HSL values', 1)");
    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s1_2', 't1', 'Test backdrop blur saturation', 0)");
    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s1_3', 't1', 'Validate AAA contrast for typography', 0)");

    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s3_1', 't3', 'Setup dragStart and dragEnd event handlers', 1)");
    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s3_2', 't3', 'Create translucent drop targets indicators', 1)");
    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s3_3', 't3', 'Implement scroll-on-drag helper for long lists', 0)");

    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s4_1', 't4', 'Build responsive SVG bar chart', 1)");
    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s4_2', 't4', 'Design donut chart for priority split', 1)");

    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s5_1', 't5', 'Run create-vite', 1)");
    db.run("INSERT INTO subtasks (id, task_id, text, completed) VALUES ('s5_2', 't5', 'Verify dev server launch', 1)");

    // Comments
    db.run("INSERT INTO comments (id, task_id, user_name, text, timestamp) VALUES ('c1_1', 't1', 'Alex Carter', 'I am thinking HSL 250 for background to give it a nice deep navy/indigo shade.', '2026-05-27T10:00:00Z')");
    db.run("INSERT INTO comments (id, task_id, user_name, text, timestamp) VALUES ('c3_1', 't3', 'Sophia Patel', 'Works beautifully on Chrome. Testing Safari now.', '2026-05-27T14:30:00Z')");
    db.run("INSERT INTO comments (id, task_id, user_name, text, timestamp) VALUES ('c3_2', 't3', 'Elena Rostova', 'Ensure touch interactions work well or degrade gracefully.', '2026-05-27T15:00:00Z')");
    db.run("INSERT INTO comments (id, task_id, user_name, text, timestamp) VALUES ('c5_1', 't5', 'Marcus Vance', 'Scaffolded and ready. Vite v8 is running fast.', '2026-05-26T18:00:00Z')");

    // Project 2 (🎨 E-Commerce Mockups)
    db.run(`
      INSERT INTO projects (id, name, description, user_id)
      VALUES ('p2', '🎨 E-Commerce Mockups', 'Asset pipeline and wireframes for the core storefront application.', 'u_demo')
    `);
    db.run("INSERT INTO columns (id, project_id, title, position) VALUES ('col_p2_1', 'p2', 'To Do', 0)");
    db.run(`
      INSERT INTO tasks (id, column_id, title, description, priority, due_date, assignee_id)
      VALUES ('t6', 'col_p2_1', 'Design checkout user flow', 'Draft the multi-step checkout form flow incorporating security badges and progress indicators.', 'medium', '2026-06-10', 'm2')
    `);
  });
}

export default db;
