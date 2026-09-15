import { useState } from "react";
import API from "../services/api";

const columns = [
  {
    id: "Todo",
    title: "Todo",
  },
  {
    id: "In Progress",
    title: "In Progress",
  },
  {
    id: "Done",
    title: "Done",
  },
];

const KanbanBoard = ({ tasks, onTaskUpdated }) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const [updating, setUpdating] = useState(false);

  // ==========================================
  // DRAG START
  // ==========================================

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  // ==========================================
  // DRAG OVER
  // ==========================================

  const handleDragOver = (e) => {
    e.preventDefault();

    e.dataTransfer.dropEffect = "move";
  };

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const updateTaskStatus = async (task, newStatus) => {
    if (!task || updating) {
      return;
    }

    if (task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      setUpdating(true);

      console.log("========== KANBAN UPDATE ==========");
      console.log("Task:", task);
      console.log("Task ID:", task._id);
      console.log("Old Status:", task.status);
      console.log("New Status:", newStatus);
      console.log("===================================");

      await API.patch(
        `/tasks/${task._id}/status`,
        {
          status: newStatus,
        }
      );

      setDraggedTask(null);

      await onTaskUpdated();
    } catch (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to update task status"
      );
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // DROP
  // ==========================================

  const handleDrop = (e, newStatus) => {
    e.preventDefault();

    if (!draggedTask) {
      return;
    }

    updateTaskStatus(
      draggedTask,
      newStatus
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="kanban-board">
      {columns.map((column) => {
        const columnTasks = tasks.filter(
          (task) => task.status === column.id
        );

        return (
          <div
            key={column.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) =>
              handleDrop(e, column.id)
            }
          >
            <div className="kanban-column-header">
              <h3>{column.title}</h3>

              <span>
                {columnTasks.length}
              </span>
            </div>

            <div className="kanban-tasks">
              {columnTasks.map((task) => (
                <div
                  key={task._id}
                  className={`kanban-card ${
                    draggedTask?._id === task._id
                      ? "dragging"
                      : ""
                  }`}
                  draggable={!updating}
                  onDragStart={() =>
                    handleDragStart(task)
                  }
                >
                  <h4>{task.title}</h4>

                  {task.description && (
                    <p>{task.description}</p>
                  )}

                  <div className="kanban-card-info">
                    <span
                      className={`priority ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <select
                    value={task.status}
                    disabled={updating}
                    onChange={(e) =>
                      updateTaskStatus(
                        task,
                        e.target.value
                      )
                    }
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    <option value="Todo">
                      Todo
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Done">
                      Done
                    </option>
                  </select>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="kanban-empty">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;