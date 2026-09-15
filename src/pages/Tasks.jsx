const getDeadlineStatus = (dueDate, status) => {
  if (!dueDate || status === "Done") {
    return { label: "No deadline", className: "deadline-normal" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (due - today) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)} day${
        Math.abs(diffDays) !== 1 ? "s" : ""
      }`,
      className: "deadline-overdue",
    };
  }

  if (diffDays === 0) {
    return {
      label: "Due today",
      className: "deadline-today",
    };
  }

  if (diffDays <= 3) {
    return {
      label: `Due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
      className: "deadline-soon",
    };
  }

  return {
    label: `Due in ${diffDays} days`,
    className: "deadline-normal",
  };
};
import { useEffect, useState } from "react";
import API from "../services/api";
import KanbanBoard from "../components/KanbanBoard";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [projectMembers, setProjectMembers] = useState({});
  const [comments, setComments] = useState({});
const [commentText, setCommentText] = useState({});
const [openComments, setOpenComments] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    status: "Todo",
    priority: "Medium",
    dueDate: "",
    assignedTo: "",
  });
  
  

  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [priorityFilter, setPriorityFilter] = useState("All");
const [projectFilter, setProjectFilter] = useState("All");
const [sortBy, setSortBy] = useState("newest");

  const fetchTasks = async () => {
    try {
      const response = await API.get("/tasks");
      setTasks(response.data.tasks);
    } catch (error) {
      setError("Failed to load tasks");
    }
  };
   const filteredTasks = tasks
  .filter((task) => {
    const searchText = search.toLowerCase();

    return (
      task.title.toLowerCase().includes(searchText) ||
      task.description?.toLowerCase().includes(searchText)
    );
  })
  .filter((task) => {
    return statusFilter === "All" || task.status === statusFilter;
  })
  .filter((task) => {
    return priorityFilter === "All" || task.priority === priorityFilter;
  })
  .filter((task) => {
    return (
      projectFilter === "All" ||
      task.project?._id === projectFilter
    );
  })
  .sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    if (sortBy === "dueSoon") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(a.dueDate) - new Date(b.dueDate);
    }

    if (sortBy === "dueLate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return new Date(b.dueDate) - new Date(a.dueDate);
    }

    return 0;
  });
const fetchComments = async (taskId) => {
  try {
    const response = await API.get(`/comments/${taskId}`);

    setComments((prev) => ({
      ...prev,
      [taskId]: response.data.comments || [],
    }));
  } catch (error) {
    console.error("Failed to load comments:", error);
  }
};

const toggleComments = async (taskId) => {
  const isOpen = openComments[taskId];

  setOpenComments((prev) => ({
    ...prev,
    [taskId]: !isOpen,
  }));

  if (!isOpen && !comments[taskId]) {
    await fetchComments(taskId);
    
  }
};

const addComment = async (taskId) => {
  const text = commentText[taskId]?.trim();

  if (!text) return;

  try {
    await API.post(`/comments/${taskId}`, {
      text,
    });

    setCommentText((prev) => ({
      ...prev,
      [taskId]: "",
    }));

    await fetchComments(taskId);
  } catch (error) {
    console.error("Failed to add comment:", error);
  }
};

const deleteComment = async (commentId, taskId) => {
  try {
    await API.delete(`/comments/${commentId}`);

    await fetchComments(taskId);
  } catch (error) {
    console.error("Failed to delete comment:", error);
  }
};

  const fetchProjects = async () => {
  try {
    const response = await API.get("/projects");

    const projectList = response.data.projects || [];

    setProjects(projectList);

    for (const project of projectList) {
      fetchProjectMembers(project._id);
    }
  } catch (error) {
    setError("Failed to load projects");
  }
};
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleProjectChange = async (e) => {
  const projectId = e.target.value;

  setFormData((prev) => ({
    ...prev,
    project: projectId,
    assignedTo: "",
  }));

  if (projectId) {
    await fetchProjectMembers(projectId);
  }
};

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      project: "",
      status: "Todo",
      priority: "Medium",
      dueDate: "",
      assignedTo:"",
    });

    setEditingId(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await API.put(`/tasks/${editingId}`, formData);
      } else {
        await API.post("/tasks", formData);
      }

      resetForm();
      setShowForm(false);
      fetchTasks();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to save task"
      );
    }
  };

  const handleEdit = async (task) => {
  const projectId = task.project?._id || task.project || "";

  setEditingId(task._id);

  if (projectId) {
    await fetchProjectMembers(projectId);
  }

  setFormData({
    title: task.title || "",
    description: task.description || "",
    project: projectId,
    status: task.status || "Todo",
    priority: task.priority || "Medium",
    dueDate: task.dueDate
      ? task.dueDate.split("T")[0]
      : "",
    assignedTo: task.assignedTo?._id || "",
  });

  setShowForm(true);
};

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await API.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      setError("Failed to delete task");
    }
  };
  const fetchProjectMembers = async (projectId) => {
  try {
    const response = await API.get(`/projects/${projectId}/members`);

    setProjectMembers((prev) => ({
      ...prev,
      [projectId]: response.data.members || [],
    }));
  } catch (error) {
    console.error("Failed to load project members:", error);
  }
};


  return (
    <div className="page-container">
      <div className="page-header">
  <div>
    <h1>Tasks</h1>
    <p>Manage your project tasks</p>
  </div>

  <button
    className="primary-btn"
    onClick={() => {
      resetForm();
      setShowForm(true);
    }}
  >
    + Create Task
  </button>
</div>

{/* Search and Filters */}
<div className="filter-bar">
  <input
    type="text"
    placeholder="🔍 Search tasks..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="All">All Status</option>
    <option value="Todo">Todo</option>
    <option value="In Progress">In Progress</option>
    <option value="Done">Done</option>
  </select>

  <select
    value={priorityFilter}
    onChange={(e) => setPriorityFilter(e.target.value)}
  >
    <option value="All">All Priority</option>
    <option value="Low">Low</option>
    <option value="Medium">Medium</option>
    <option value="High">High</option>
  </select>
  
</div>


      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="project-form" onSubmit={handleSubmit}>
          <h2>
            {editingId ? "Edit Task" : "Create Task"}
          </h2>

          <input
            type="text"
            name="title"
            placeholder="Task title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Task description"
            value={formData.description}
            onChange={handleChange}
          />

          <select
            name="project"
            value={formData.project}
            onChange={handleProjectChange}
            required
          >
            <option value="">Select Project</option>

            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
  name="assignedTo"
  value={formData.assignedTo}
  onChange={handleChange}
>
  <option value="">Unassigned</option>

  {(projectMembers[formData.project] || []).map((member) => (
    <option key={member._id} value={member._id}>
      {member.name} ({member.email})
    </option>
  ))}
</select>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select
  value={projectFilter}
  onChange={(e) => setProjectFilter(e.target.value)}
>
  <option value="All">All Projects</option>

  {projects.map((project) => (
    <option key={project._id} value={project._id}>
      {project.name}
    </option>
  ))}
</select>

<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
  <option value="dueSoon">Due Date: Soonest</option>
  <option value="dueLate">Due Date: Latest</option>
</select>

          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
          />

          <div className="form-buttons">
            <button type="submit" className="primary-btn">
              {editingId ? "Update Task" : "Create Task"}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="projects-grid">
        {filteredTasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          filteredTasks.map((task) => (
            <div className="project-card" key={task._id}>
              <h3>{task.title}</h3>

              <p>{task.description}</p>

              <p>
                <strong>Project:</strong>{" "}
                {task.project?.name || "Unknown"}
              </p>

              <p>
                <strong>Status:</strong> {task.status}
              </p>

              <p>
                <strong>Priority:</strong> {task.priority}
              </p>

             {task.dueDate && (() => {
  const dueDate = new Date(task.dueDate);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const difference =
    Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  let label = "Due";
  let className = "due-normal";

  if (task.status === "Done") {
    label = "Completed";
    className = "due-completed";
  } else if (difference < 0) {
    label = `Overdue by ${Math.abs(difference)} day${
      Math.abs(difference) === 1 ? "" : "s"
    }`;
    className = "due-overdue";
  } else if (difference === 0) {
    label = "Due today";
    className = "due-today";
  } else if (difference <= 3) {
    label = `Due in ${difference} day${
      difference === 1 ? "" : "s"
    }`;
    className = "due-soon";
  } else {
    label = `Due ${dueDate.toLocaleDateString()}`;
  }

  return (
    <span className={`task-due-date ${className}`}>
      📅 {label}
    </span>
  );
})()}
<KanbanBoard
  tasks={tasks}
  onTaskUpdated={fetchTasks}
/>
<select
  value={task.status}
  onChange={(e) => {
    const newStatus = e.target.value;

    setDraggedTask(task);
    handleDrop(newStatus);
  }}
  onClick={(e) => e.stopPropagation()}
>
  <option value="Todo">Todo</option>
  <option value="In Progress">In Progress</option>
  <option value="Done">Done</option>
</select>

              <div className="card-buttons">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(task)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(task._id)}
                >
                  Delete
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => toggleComments(task._id)}>💬 Comments
                </button>
              </div>
              {openComments[task._id] && (
  <div className="comments-section">
    <h4>Comments</h4>

    <div className="comment-input">
      <input
        type="text"
        placeholder="Write a comment..."
        value={commentText[task._id] || ""}
        onChange={(e) =>
          setCommentText((prev) => ({
            ...prev,
            [task._id]: e.target.value,
          }))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addComment(task._id);
          }
        }}
      />

      <button
        className="primary-btn"
        onClick={() => addComment(task._id)}
      >
        Add
      </button>
    </div>

    <div className="comments-list">
      {(comments[task._id] || []).length === 0 ? (
        <p className="no-comments">No comments yet.</p>
      ) : (
        comments[task._id].map((comment) => (
          <div className="comment-item" key={comment._id}>
            <div>
              <strong>{comment.user?.name || "User"}</strong>
              <p>{comment.text}</p>
              <small>
                {new Date(comment.createdAt).toLocaleString()}
              </small>
            </div>

            {comment.user?._id ===
              JSON.parse(localStorage.getItem("user"))?._id && (
              <button
                className="delete-comment"
                onClick={() =>
                  deleteComment(comment._id, task._id)
                }
              >
                Delete
              </button>
            )}
          </div>
        ))
      )}
    </div>
  </div>
)}
            </div>
          ))
        )}
      </div>
     
    </div>
  );
}

export default Tasks;