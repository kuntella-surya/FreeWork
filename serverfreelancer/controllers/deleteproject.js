import Projectpost from "../models/Project.js";
import mongoose from "mongoose";

// Delete Project Controller
 export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user
    const projectId = req.params._id;
    console.log("Delete request for project ID:", projectId, "by user ID:", userId);
    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Find the project
    const project = await Projectpost.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only the owner can delete
    console.log("Project client ID:", project.clientId.toString() , "User ID:", userId);
    if (project.clientId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this project" });
    }

    // Delete the project
    await Projectpost.findByIdAndDelete(projectId);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Server error" });
  }
};