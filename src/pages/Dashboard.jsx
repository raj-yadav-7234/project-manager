import { useEffect, useState } from "react";
import API from "../services/api";
import TaskStatusChart from "../components/TaskStatusChart";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
 const [notifications, setNotifications] = useState([]);
const [notificationLoading, setNotificationLoading] = useState(true);
const [taskStatusData, setTaskStatusData] = useState({
  Todo: 0,
  "In Progress": 0,
  Done: 0,
});

const fetchNotifications = async () => {
  try {
    const response = await API.get("/notifications");

    setNotifications(response.data.notifications || []);
  } catch (error) {
    console.error(
      "Notifications error:",
      error.response?.data || error.message
    );
  } finally {
    setNotificationLoading(false);
  }
};

useEffect(() => {
  fetchDashboardData();
  fetchNotifications();
}, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        API.get("/projects"),
        API.get("/tasks"),
      ]);
     

      setProjects(projectsResponse.data.projects || []);
      setTasks(tasksResponse.data.tasks || []);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const completedProjects = projects.filter(
    (project) => project.status === "Completed"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "Todo"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "High"
  ).length;

  const progress =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;
      const today = new Date();
today.setHours(0, 0, 0, 0);

const overdueTasks = tasks.filter((task) => {
  if (!task.dueDate || task.status === "Done") return false;

  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
});

const upcomingTasks = tasks
  .filter((task) => {
    if (!task.dueDate || task.status === "Done") return false;

    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays =
      (due - today) / (1000 * 60 * 60 * 24);

    return diffDays >= 0 && diffDays <= 7;
  })
  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (loading) {
  return (
    <div className="page-container">
      <LoadingSpinner text="Loading dashboard..." />
    </div>
  );
}
 

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your projects and tasks</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Projects</h3>
          <strong>{projects.length}</strong>
        </div>

        <div className="stat-card">
          <h3>Completed Projects</h3>
          <strong>{completedProjects}</strong>
        </div>

        <div className="stat-card">
          <h3>Total Tasks</h3>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat-card">
          <h3>High Priority</h3>
          <strong>{highPriorityTasks}</strong>
        </div>
      </div>

      {/* Task Progress */}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Task Progress</h2>
          <strong>{progress}%</strong>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <div className="dashboard-card">
  <h2>Task Overview</h2>
  <div className="dashboard-card">
  <div className="dashboard-card-header">
    <h2>Task Status</h2>
    <span>
      {taskStatusData.Todo +
        taskStatusData["In Progress"] +
        taskStatusData.Done}{" "}
      Tasks
    </span>
  </div>

  <div className="task-status-chart">
    <div className="status-chart-row">
      <div className="status-chart-label">
        <span>Todo</span>
        <strong>{taskStatusData.Todo}</strong>
      </div>

      <div className="status-chart-bar">
        <div
          className="status-chart-fill todo"
          style={{
            width: `${
              (taskStatusData.Todo /
                Math.max(
                  taskStatusData.Todo +
                    taskStatusData["In Progress"] +
                    taskStatusData.Done,
                  1
                )) *
              100
            }%`,
          }}
        />
      </div>
    </div>

    <div className="status-chart-row">
      <div className="status-chart-label">
        <span>In Progress</span>
        <strong>{taskStatusData["In Progress"]}</strong>
      </div>

      <div className="status-chart-bar">
        <div
          className="status-chart-fill progress"
          style={{
            width: `${
              (taskStatusData["In Progress"] /
                Math.max(
                  taskStatusData.Todo +
                    taskStatusData["In Progress"] +
                    taskStatusData.Done,
                  1
                )) *
              100
            }%`,
          }}
        />
      </div>
    </div>

    <div className="status-chart-row">
      <div className="status-chart-label">
        <span>Done</span>
        <strong>{taskStatusData.Done}</strong>
      </div>

      <div className="status-chart-bar">
        <div
          className="status-chart-fill done"
          style={{
            width: `${
              (taskStatusData.Done /
                Math.max(
                  taskStatusData.Todo +
                    taskStatusData["In Progress"] +
                    taskStatusData.Done,
                  1
                )) *
              100
            }%`,
          }}
        />
      </div>
    </div>
  </div>
</div>

  <div className="task-chart">
    <div className="chart-item">
      <span>Todo</span>
      <div className="chart-bar">
        <div
          className="chart-fill"
          style={{
            width: `${
              tasks.length
                ? (todoTasks / tasks.length) * 100
                : 0
            }%`,
          }}
        ></div>
      </div>
      <strong>{todoTasks}</strong>
    </div>

    <div className="chart-item">
      <span>In Progress</span>
      <div className="chart-bar">
        <div
          className="chart-fill"
          style={{
            width: `${
              tasks.length
                ? (inProgressTasks / tasks.length) * 100
                : 0
            }%`,
          }}
        ></div>
      </div>
      <strong>{inProgressTasks}</strong>
    </div>

    <div className="chart-item">
      <span>Completed</span>
      <div className="chart-bar">
        <div
          className="chart-fill"
          style={{
            width: `${
              tasks.length
                ? (completedTasks / tasks.length) * 100
                : 0
            }%`,
          }}
        ></div>
      </div>
      <strong>{completedTasks}</strong>
    </div>
  </div>
</div>

      {/* Task Status */}
      <div className="dashboard-grid">
        <div className="dashboard-card upcoming-deadlines">
  <h2>Upcoming Deadlines</h2>

  {upcomingTasks.length === 0 ? (
    <p>No upcoming deadlines 🎉</p>
  ) : (
    upcomingTasks.slice(0, 5).map((task) => (
      <div className="deadline-item" key={task._id}>
        <div>
          <strong>{task.title}</strong>

          {task.project?.name && (
            <small>{task.project.name}</small>
          )}
        </div>

        <span>
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      </div>
    ))
  )}
</div>
<div className="dashboard-card">
  <div className="card-header">
    <h2>🔔 Notifications</h2>

    <strong>{notifications.length}</strong>
  </div>

  {notificationLoading ? (
    <p>Loading notifications...</p>
  ) : notifications.length === 0 ? (
    <p>No notifications 🎉</p>
  ) : (
    <div className="notifications-list">
      {notifications.slice(0, 5).map((notification) => (
        <div
          className="notification-item"
          key={notification._id}
        >
          <div>
            <strong>{notification.message}</strong>

            <small>
              {notification.createdAt
                ? new Date(
                    notification.createdAt
                  ).toLocaleString()
                : ""}
            </small>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
        <div className="dashboard-card">
          <h2>Task Status</h2>

          <div className="status-row">
            <span>Todo</span>
            <strong>{todoTasks}</strong>
            <TaskStatusChart data={taskStatusData} />
          </div>

          <div className="status-row">
            <span>In Progress</span>
            <strong>{inProgressTasks}</strong>
          </div>

          <div className="status-row">
            <span>Completed</span>
            <strong>{completedTasks}</strong>
          </div>
        </div>

        {/* Projects */}
        <div className="dashboard-card">
          <h2>Projects</h2>

          {projects.length === 0 ? (
            <p>No projects yet.</p>
          ) : (
            projects.slice(0, 5).map((project) => (
              <div className="status-row" key={project._id}>
                <span>{project.name}</span>
                <strong>{project.status}</strong>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;