import Projectpost from "../models/Project.js";
import mongoose from "mongoose";

// Update Project Controller
export const updateProject = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Find project by ID
    const project = await Projectpost.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only project owner can update
    if (project.clientId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to update this project" });
    }

    // Extract fields from request body
    const {
      title,
      description,
      category,
      projectType,
      skillsRequired,
      budget,
      duration,
      location
    } = req.body;

    // Update fields if provided
    if (title) project.title = title;
    if (description) project.description = description;
    if (category) project.category = category;
    if (projectType) project.projectType = projectType;
    if (skillsRequired) project.skillsRequired = skillsRequired;
    if (budget?.min !== undefined) project.budget.min = budget.min;
    if (budget?.max !== undefined) project.budget.max = budget.max;
    if (duration) project.duration = duration;
    if (location) project.location = { ...project.location, ...location };

    // Save updated project
    await project.save();

    res.status(200).json({
      message: "Project updated successfully",
      project
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ message: "Server error" });
  }
};
