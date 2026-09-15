const express = require("express");
const router = express.Router();

const Comment = require("../models/Comment");
const Task = require("../models/tasks");
const Project = require("../models/project");
const User = require("../models/User");
const authMiddleware = require("../middleware/authmiddleware");

// Check whether user can access the task
const canAccessTask = async (task, userId) => {
  if (!task) return false;

  // Task owner
  if (task.owner.toString() === userId.toString()) {
    return true;
  }

  // Assigned member
  if (
    task.assignedTo &&
    task.assignedTo.toString() === userId.toString()
  ) {
    return true;
  }

  // Project member
  const project = await Project.findById(task.project);

  if (!project) return false;

  return project.members.some(
    (memberId) =>
      memberId.toString() === userId.toString()
  );
};


// GET comments for a task
router.get("/:taskId", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const allowed = await canAccessTask(task, req.userId);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this task",
      });
    }

    const comments = await Comment.find({
      task: req.params.taskId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ADD comment
router.post("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const allowed = await canAccessTask(task, req.userId);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to comment",
      });
    }

    const comment = await Comment.create({
      text: text.trim(),
      task: task._id,
      user: req.userId,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name email");

    // Notify task owner when another user comments
    if (
      task.owner.toString() !== req.userId.toString()
    ) {
      const commenter = await User.findById(req.userId);

      if (commenter) {
        const Notification = require("../models/Notification");

        await Notification.create({
          user: task.owner,
          message: `${commenter.name} commented on your task "${task.title}"`,
          type: "comment",
          relatedTask: task._id,
          relatedProject: task.project,
        });
      }
    }

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// DELETE comment
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Only the person who wrote the comment can delete it
    if (
      comment.user.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;