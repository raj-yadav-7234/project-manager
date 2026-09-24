# Project Manager

A full-stack project management application built with React, Node.js, Express, and MongoDB.

The application allows users to create and manage projects, assign tasks, collaborate with project members, track progress, and receive notifications.

## 🚀 Live Demo

- Frontend: https://project-manager-one-amber.vercel.app/
- Backend API: https://project-manager-2-45wb.onrender.com

## ✨ Features

### Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Logout functionality

### Projects
- Create, view, edit, and delete projects
- Project status and priority
- Project descriptions and due dates
- Add and remove project members
- View project details and progress

### Tasks
- Create, edit, and delete tasks
- Assign tasks to project members
- Task status:
  - Todo
  - In Progress
  - Done
- Task priorities:
  - Low
  - Medium
  - High
- Due dates
- Overdue task indicators
- Search and filtering
- Kanban board with drag-and-drop status updates

### Collaboration
- Project members
- Task comments
- Task assignment notifications
- Notification center
- Automatic notification refresh

### Dashboard
- Project statistics
- Task statistics
- Task completion progress
- High-priority task count
- Overdue tasks
- Upcoming tasks
- Task status visualization

### UI & UX
- Responsive design
- Dark mode
- Loading states
- Empty states
- Mobile-friendly layout

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Helmet
- CORS

### Deployment
- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

## 📁 Project Structure

```text
project-manager/
│
├── src/
│   ├── components/
│   │   ├── KanbanBoard.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── context/
│   │   ├── authContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── layouts/
│   │   └── MainLayout.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Profile.jsx
│   │   ├── ProjectDetails.jsx
│   │   ├── Projects.jsx
│   │   ├── Register.jsx
│   │   └── Tasks.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── server/
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── Comment.js
│   │   ├── Notification.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── .gitignore
├── package.json
└── README.md
check all files
