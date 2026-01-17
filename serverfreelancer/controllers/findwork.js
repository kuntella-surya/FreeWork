import mongoose from "mongoose";
import Projectpost from "../models/Project.js";
export const findWork = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { latitude, longitude, range = 10, category, projectType, sortBy } = req.query;

    // Only show open projects
    let matchStage = {
      clientId: { $ne: userId },
      status: "open",
    };

    if (category) matchStage.category = category;
    if (projectType) matchStage.projectType = projectType;

    let projects;

    if (latitude && longitude) {
      const maxDistance = parseFloat(range) * 1000; // km → meters

      projects = await Projectpost.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: "distance",
            maxDistance,
            spherical: true,
            query: matchStage,
          },
        },
      ]);
    } else {
      projects = await Projectpost.find(matchStage);
    }

    // Sorting logic
    if (sortBy === "budget") {
      projects.sort((a, b) => b.budget.max - a.budget.max);
    } else if (sortBy === "date") {
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json({ projects });
  } catch (err) {
    console.error("Error in findWork:", err);
    res.status(500).json({ message: "Server error" });
  }
};
