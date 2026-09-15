import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

const ProjectDetails = () => {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, LoadingSpinner] = useState(true);
  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [priorityFilter, setPriorityFilter] = useState("All");
const [memberEmail, setMemberEmail] = useState("");
const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const [projectResponse, tasksResponse, membersResponse] =
        await Promise.all([
          API.get(`/projects/${id}`),
          API.get("/tasks"),
          API.get(`/projects/${id}/members`),
        ]);

      setProject(projectResponse.data.project);

      const allTasks = tasksResponse.data.tasks || [];

      setTasks(
        allTasks.filter(
          (task) =>
            task.project?._id === id ||
            task.project === id
        )
      );

      setMembers(membersResponse.data.members || []);
    } catch (error) {
      console.error(
        "Project details error:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
  return (
    <div className="page-container">
      <LoadingSpinner text="Loading project..." />
    </div>
  );
}

  if (!project) {
    return (
      <div className="page-container">
        <h2>Project not found</h2>
      </div>
    );
  }

  const completedTasks = tasks.filter(
    (task) => task.status === "Done"
  ).length;

  const progress =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;


  const filteredTasks = tasks.filter((task) => {
  const matchesSearch = task.title
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" ||
    task.status === statusFilter;

  const matchesPriority =
    priorityFilter === "All" ||
    task.priority === priorityFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPriority
  );
});
const handleAddMember = async (e) => {
  e.preventDefault();

  if (!memberEmail.trim()) {
    alert("Enter member email");
    return;
  }

  try {
    setMemberLoading(true);

    await API.post(`/projects/${id}/members`, {
      email: memberEmail.trim(),
    });

    setMemberEmail("");

    const response = await API.get(
      `/projects/${id}/members`
    );

    setMembers(response.data.members || []);

    alert("Member added successfully");
  } catch (error) {
    console.error(
      "Add member error:",
      error.response?.data || error.message
    );

    alert(
      error.response?.data?.message ||
        "Failed to add member"
    );
  } finally {
    setMemberLoading(false);
  }
};
const handleRemoveMember = async (memberId) => {
  const confirmRemove = window.confirm(
    "Remove this member from the project?"
  );

  if (!confirmRemove) return;

  try {
    await API.delete(
      `/projects/${id}/members/${memberId}`
    );

    setMembers((currentMembers) =>
      currentMembers.filter(
        (member) => member._id !== memberId
      )
    );
  } catch (error) {
    console.error(
      "Remove member error:",
      error.response?.data || error.message
    );

    alert(
      error.response?.data?.message ||
        "Failed to remove member"
    );
  }
};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>

          <p>
            {project.description || "No project description"}
          </p>
        </div>
      </div>

      {/* Project Information */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Status</h3>
          <strong>{project.status}</strong>
        </div>

        <div className="stat-card">
          <h3>Priority</h3>
          <strong>{project.priority}</strong>
        </div>

        <div className="stat-card">
          <h3>Total Tasks</h3>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat-card">
          <h3>Progress</h3>
          <strong>{progress}%</strong>
        </div>
      </div>

      {/* Progress */}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Project Progress</h2>
          <strong>{progress}%</strong>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Tasks */}
        <div className="dashboard-card">
  <h2>Project Tasks</h2>

  <div className="task-filters">
    <input
      type="text"
      placeholder="Search tasks..."
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

  {filteredTasks.length === 0 ? (
    <p>No matching tasks found.</p>
  ) : (
    filteredTasks.map((task) => (
      <div
        className="status-row"
        key={task._id}
      >
        <div>
          <strong>{task.title}</strong>

          {task.description && (
            <small>{task.description}</small>
          )}
        </div>

        <div>
          <strong>{task.status}</strong>
          <small>{task.priority}</small>
        </div>
      </div>
    ))
  )}
</div>

        {/* Members */}
        <div className="dashboard-card">
          <h2>Project Members</h2>
          <form className="member-form" onSubmit={handleAddMember}>
            <input type="email" placeholder="Member email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
            <button type="submit" disabled={memberLoading}>
                {memberLoading ? "adding..." : " + Add Member"} </button>
          </form>
           <div className="members-list">
    {members.length === 0 ? (
      <p>No members added yet.</p>
    ) : (
      members.map((member) => (
        <div
          className="member-item"
          key={member._id}
        >
          <div>
            <strong>{member.name}</strong>
            <small>{member.email}</small>
          </div>

          <button
            type="button"
            className="remove-member-btn"
            onClick={() =>
              handleRemoveMember(member._id)
            }
          >
            <button>REMOVE</button>
          </button>
        </div>
      ))
    )}
  </div>
          
          
        </div>
      </div>

      {/* Project Details */}
      <div className="dashboard-card">
        <h2>Project Details</h2>

        <div className="status-row">
          <span>Created</span>

          <strong>
            {new Date(project.createdAt).toLocaleDateString()}
          </strong>
        </div>

        <div className="status-row">
          <span>Due Date</span>

          <strong>
            {project.dueDate
              ? new Date(
                  project.dueDate
                ).toLocaleDateString()
              : "No due date"}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;