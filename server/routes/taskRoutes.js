const express = require("express");
const router = express.Router();

const Task = require("../models/tasks");
const Project = require("../models/project");
const User = require("../models/User");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authmiddleware");

// CREATE TASK
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description = "",
      project,
      status = "Todo",
      priority = "Medium",
      dueDate,
      assignedTo,
    } = req.body;

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "Task title must be 150 characters or less",
      });
    }

    // Validate description
    if (typeof description !== "string" || description.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Description must be 2000 characters or less",
      });
    }

    // Validate project
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project is required",
      });
    }

    // Validate status
    const allowedStatuses = ["Todo", "In Progress", "Done"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    // Validate priority
    const allowedPriorities = ["Low", "Medium", "High"];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority",
      });
    }

    // Validate due date
    if (dueDate) {
      const parsedDate = new Date(dueDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
        });
      }
    }

    // Check project
    const existingProject = await Project.findOne({
      _id: project,
      owner: req.userId,
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check assigned user
    let assignedUser = null;

    if (assignedTo) {
      assignedUser = await User.findById(assignedTo);

      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found",
        });
      }

      const isMember = existingProject.members.some(
        (memberId) =>
          memberId.toString() === assignedTo.toString()
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: "User is not a member of this project",
        });
      }
    }

    // Create task
    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      project,
      owner: req.userId,
      assignedTo: assignedTo || null,
      status,
      priority,
      dueDate: dueDate || null,
    });

    // Notification for assigned user
    if (assignedUser) {
      await Notification.create({
        user: assignedUser._id,
        message: `You have been assigned the task "${task.title}"`,
        type: "task",
        relatedTask: task._id,
        relatedProject: task.project,
      });
    }

    // Populate task information
    const populatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedTo", "name email");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create task error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ==========================================
// GET ALL TASKS
// ==========================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId },
      ],
    }).select("_id");

    const projectIds = projects.map(
      (project) => project._id
    );

    const tasks = await Task.find({
      $or: [
        { owner: req.userId },
        { assignedTo: req.userId },
        { project: { $in: projectIds } },
      ],
    })
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// GET SINGLE TASK
// ==========================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const project = await Project.findById(task.project?._id);

    const isOwner =
      task.owner.toString() === req.userId.toString();

    const isAssigned =
      task.assignedTo &&
      task.assignedTo._id.toString() ===
        req.userId.toString();

    const isMember =
      project &&
      project.members.some(
        (memberId) =>
          memberId.toString() === req.userId.toString()
      );

    if (!isOwner && !isAssigned && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this task",
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// UPDATE TASK
// ==========================================

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isOwner =
      task.owner.toString() === req.userId.toString();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this task",
      });
    }

    const {
      title,
      description,
      project,
      assignedTo,
      status,
      priority,
      dueDate,
    } = req.body;

    if (title !== undefined) {
      task.title = title;
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (status !== undefined) {
      task.status = status;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    // Change project
    if (project !== undefined) {
      const existingProject = await Project.findOne({
        _id: project,
        owner: req.userId,
      });

      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      task.project = project;
    }

    // Change assigned user
    if (assignedTo !== undefined) {
      if (assignedTo === "" || assignedTo === null) {
        task.assignedTo = null;
      } else {
        const existingProject = await Project.findOne({
          _id: task.project,
          owner: req.userId,
        });

        if (!existingProject) {
          return res.status(404).json({
            success: false,
            message: "Project not found",
          });
        }

        const isMember = existingProject.members.some(
          (memberId) =>
            memberId.toString() === assignedTo.toString()
        );

        if (!isMember) {
          return res.status(400).json({
            success: false,
            message: "User is not a member of this project",
          });
        }

        task.assignedTo = assignedTo;
      }
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedTo", "name email");

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// UPDATE TASK STATUS
// ==========================================

router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    console.log("========== STATUS UPDATE ==========");
    console.log("Task ID:", req.params.id);
    console.log("User ID:", req.userId);
    console.log("New Status:", status);
    console.log("===================================");

    if (!["Todo", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isOwner =
      task.owner.toString() === req.userId.toString();

    const isAssigned =
      task.assignedTo &&
      task.assignedTo.toString() === req.userId.toString();

    const project = await Project.findById(task.project);

    const isMember =
      project &&
      project.members.some(
        (memberId) =>
          memberId.toString() === req.userId.toString()
      );

    if (!isOwner && !isAssigned && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to change this task",
      });
    }

    task.status = status;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedTo", "name email");

    res.json({
      success: true,
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Status update error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// DELETE TASK
// ==========================================

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (
      task.owner.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this task",
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;