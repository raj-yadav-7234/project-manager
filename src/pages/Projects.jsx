import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Planning",
    priority: "Medium",
    dueDate: "",
  });
  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [priorityFilter, setPriorityFilter] = useState("All");

  const [error, setError] = useState("");
  const [members, setMembers] = useState({});

const [memberEmail, setMemberEmail] = useState("");
  // Get projects
  const fetchProjects = async () => {
    try {
      const response = await API.get("/projects");
      setProjects(response.data.projects);
      response.data.projects.forEach((project) => {
  fetchMembers(project._id);
});
    } catch (error) {
      setError("Failed to load projects");
    }
  };
  const fetchMembers = async (projectId) => {
  try {
    const response = await API.get(
      `/projects/${projectId}/members`
    );

    setMembers((prev) => ({
      ...prev,
      [projectId]: response.data.members,
    }));
  } catch (error) {
    console.error("Failed to load members");
  }
};

const addMember = async (projectId) => {
  if (!memberEmail.trim()) {
    return;
  }

  try {
    await API.post(`/projects/${projectId}/members`, {
      email: memberEmail,
    });

    setMemberEmail("");

    fetchMembers(projectId);
  } catch (error) {
    setError(
      error.response?.data?.message || "Failed to add member"
    );
  }
};

const removeMember = async (projectId, userId) => {
  try {
    await API.delete(
      `/projects/${projectId}/members/${userId}`
    );

    fetchMembers(projectId);
  } catch (error) {
    setError("Failed to remove member");
  }
};

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const resetForm = () => {
  setFormData({
    name: "",
    description: "",
    status: "Planning",
    priority: "Medium",
    dueDate: "",
  });

  setEditingId(null);
};

  // Create project
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (editingId) {
      await API.put(`/projects/${editingId}`, formData);
    } else {
      await API.post("/projects", formData);
    }

    resetForm();
    setShowForm(false);
    fetchProjects();
  } catch (error) {
    setError(
      error.response?.data?.message || "Failed to save project"
    );
  }
};

  const handleEdit = (project) => {
  setEditingId(project._id);

  setFormData({
    name: project.name,
    description: project.description || "",
    status: project.status,
    priority: project.priority,
    dueDate: project.dueDate
      ? project.dueDate.split("T")[0]
      : "",
  });

  setShowForm(true);
};

  // Delete project
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/projects/${id}`);
      fetchProjects();
    } catch (error) {
      setError("Failed to delete project");
    }
  };
  
  const filteredProjects = projects.filter((project) => {
  const matchesSearch =
    project.name.toLowerCase().includes(search.toLowerCase()) ||
    project.description.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" ||
    project.status === statusFilter;

  const matchesPriority =
    priorityFilter === "All" ||
    project.priority === priorityFilter;

  return matchesSearch && matchesStatus && matchesPriority;
});



  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage all your projects in one place.</p>
        </div>

        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && (
        <div className="project-form">
          <h2>{editingId ? "Edit Project" : "Create Project"}</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Project name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Project description"
              value={formData.description}
              onChange={handleChange}
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
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

            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />

           <button type="submit">
  {editingId ? "Update Project" : "Create Project"}</button>
          </form>
        </div>
      )}
      <div className="filter-bar">
  <input
    type="text"
    placeholder="Search projects..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="All">All Status</option>
    <option value="Planning">Planning</option>
    <option value="Active">Active</option>
    <option value="Completed">Completed</option>
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

      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create your first project to get started.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div className="project-card" key={project._id}>
              <div className="members-section">
  <h4>Team Members</h4>

  {members[project._id]?.length > 0 ? (
    members[project._id].map((member) => (
      <div className="member-item" key={member._id}>
        <span>
          {member.name} ({member.email})
        </span>

        <button
          className="remove-member-btn"
          onClick={() =>
            removeMember(project._id, member._id)
          }
        >
          Remove
        </button>
      </div>
    ))
  ) : (
    <p>No team members</p>
  )}

  <div className="add-member">
    <input
      type="email"
      placeholder="Member email"
      value={memberEmail}
      onChange={(e) => setMemberEmail(e.target.value)}
    />

    <button
      className="secondary-btn"
      onClick={() => addMember(project._id)}
    >
      Add
    </button>
  </div>
</div>
              <div className="project-card-header">
                <h2>
                  <Link to={`/projects/${project._id}`}>
                  {project.name}</Link>
                 </h2>

            <div>
                <button onClick={() => handleEdit(project)}>Edit
                 </button>
                <button
                className="delete-btn"
                onClick={() => handleDelete(project._id)}>Delete
                </button>
                </div>
            </div>

              <p>{project.description || "No description"}</p>

              <div className="project-info">
                <span>Status: {project.status}</span>
                <span>Priority: {project.priority}</span>
              </div>

              {project.dueDate && (
                <p>
                  Due:{" "}
                  {new Date(project.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Projects;