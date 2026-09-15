import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContent";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import API from "../services/api";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await API.get("/notifications");

        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

     if (!user) return;

  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 30000);

  return () => clearInterval(interval);
}, [user]);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const formatNotificationTime = (date) => {
  if (!date) return "";

  const diff = Date.now() - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return formatNotificationTime(notification.createdAt)
};

  return (
    <div className="app-layout">
      <header className="navbar">
        <div className="navbar-left">
          <Link to="/dashboard" className="logo">
            Project Manager
          </Link>

          <nav>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/tasks">Tasks</Link>
            <Link to="/profile">Profile</Link>
          </nav>
        </div>

        <div className="navbar-right">
          <button
  className="theme-toggle"
  onClick={toggleDarkMode}
  title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
>
  {darkMode ? "☀️" : "🌙"}
</button>
          {/* Notification Bell */}
          <div className="notification-wrapper">
            <button
              className="notification-button"
              onClick={() =>
                setShowNotifications(!showNotifications)
              }
            >
              🔔

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount}
                </span>
              )}
            </button>
            

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <strong>Notifications</strong>

                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead}>
                      Mark all read
                    </button>
                    
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="no-notifications">
                    No notifications
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item ${
                        notification.read ? "read" : "unread"
                      }`}
                      onClick={() =>
                        !notification.read &&
                        markAsRead(notification._id)
                      }
                    >
                      <p>{notification.message}</p>

                      <small>
                        {new Date(
                          notification.createdAt
                        ).toLocaleString()}
                      </small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <span className="user-name">
            {user?.name}
          </span>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;