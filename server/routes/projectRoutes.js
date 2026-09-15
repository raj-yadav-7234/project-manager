const express = require("express");
const Project = require("../models/project");
const authMiddleware = require("../middleware/authmiddleware");
const User= require("../models/User.js")

const router = express.Router();

// CREATE PROJECT
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description = "",
      status = "Planning",
      priority = "Medium",
      dueDate,
    } = req.body;

    // Validate project name
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    // Limit project name length
    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Project name must be 100 characters or less",
      });
    }

    // Limit description length
    if (
      typeof description !== "string" ||
      description.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be 1000 characters or less",
      });
    }

    // Validate status
    const allowedStatuses = [
      "Planning",
      "Active",
      "Completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status",
      });
    }

    // Validate priority
    const allowedPriorities = [
      "Low",
      "Medium",
      "High",
    ];

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project priority",
      });
    }

    // Validate due date if provided
    if (dueDate) {
      const parsedDate = new Date(dueDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
        });
      }
    }

    const project = await Project.create({
      name: name.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      owner: req.userId,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
// GET MY PROJECTS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId },
      ],
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET SINGLE PROJECT
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// UPDATE PROJECT
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.userId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// DELETE PROJECT
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
router.post("/:id/members", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You are already the project owner",
      });
    }

    if (project.members.includes(user._id)) {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }

    project.members.push(user._id);

    await project.save();

    res.json({
      success: true,
      message: "Member added successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// GET PROJECT MEMBERS
router.get("/:id/members", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    }).populate("members", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      members: project.members,
    });
  } catch (error) {
    console.error("Get members error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.delete(
  "/:id/members/:userId",
  authMiddleware,
  async (req, res) => {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        owner: req.userId,
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      project.members = project.members.filter(
        (member) => member.toString() !== req.params.userId
      );

      await project.save();

      res.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;