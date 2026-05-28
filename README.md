# 🌌 Aether Board — Full-Stack Glassmorphic Project Management Dashboard

Aether Board is a premium, high-class Project Management Dashboard (Kanban board) built as a full-stack web application. It combines a state-of-the-art **Glassmorphic UI** (using backdrop blurs, radial mesh gradients, and glowing effects) with an optimized, lightweight backend, user authentication, and live multi-user collaboration using WebSockets.

---

## 🌟 Core Features

- **🔑 JWT User Authentication:** Secure register & login system. Includes a built-in pre-seeded **Demo Manager** account for instant recruiter testing.
- **📋 Kanban Boards:** Create, customize, and manage projects and columns. Cards display task details, subtask checklists, and priority colors.
- **🖱️ Native Drag-and-Drop:** Smooth drag-and-drop task card movement across lists powered by HTML5 APIs with micro-interactions.
- **⚡ WebSockets (Socket.io) Integration:** Board movements, card changes, and comments synchronize across multiple opened browser windows in real-time.
- **🔔 Live Floating Toast Notifications:** Visual alerts showing board activity (e.g. *“Sophia Patel moved 'Implement Drag & Drop' to Completed”*) via WebSockets.
- **📊 SVG Data Analytics:** Interactive custom SVG-based Bar and Donut Charts mapping task status and priority distributions without heavy library overhead.
- **🗄️ SQLite Zero-Config Database:** Uses SQLite to store users, projects, tasks, checklists, and comments. The database runs out of a local file—**requiring zero local database software setup** for the reviewer.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Lucide Icons, Vanilla CSS (Glassmorphism & animations)
- **Backend:** Express, Node.js, Socket.io (WebSockets), JWT (Auth), bcryptjs (Hashing)
- **Database:** SQLite3

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have **Node.js (v18+)** installed.

### 1. Installation
In the root directory, run the installer script to automatically download all packages for the root, backend server, and frontend client:
```bash
npm run install-all
```

### 2. Running in Development Mode
Start both the Express backend server and the Vite frontend client concurrently with a single command:
```bash
npm run dev
```
- **Frontend Client:** `http://localhost:5173`
- **Backend API Server:** `http://localhost:5000`

---

## 👤 Recruiter Test Credentials

For quick evaluation without registering a new account:
- **Username:** `demo`
- **Password:** `password`
*(Alternatively, you can create a new user profile on the register page, choose a customizable role, and select an avatar theme color!)*
