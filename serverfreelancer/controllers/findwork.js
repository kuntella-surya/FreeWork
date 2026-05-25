import mongoose from "mongoose";
import Projectpost from "../models/Project.js";

export const findWork = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { 
      latitude, 
      longitude, 
      range = 10, 
      category, 
      projectType, 
      sortBy = "date" 
    } = req.query;

    let matchStage = {
      clientId: { $ne: userId },
      status: "open",           // Only show open projects
    };

    if (category) matchStage.category = category;
    
    // Handle multiple project types
    if (projectType) {
      matchStage.projectType = { 
        $in: projectType.split(",").map(t => t.trim()) 
      };
    }

    let projects = [];

    if (latitude && longitude) {
      const maxDistance = parseFloat(range) * 1000; // km to meters

      projects = await Projectpost.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: "distance",     // distance in meters
            maxDistance: maxDistance,
            spherical: true,
            query: matchStage,
          },
        },
        {
          $sort: sortBy === "budget" 
            ? { "budget.max": -1 } 
            : { createdAt: -1 }
        },
        { $limit: 50 }   // Prevent too many results
      ]);
    } else {
      // Fallback when location not available
      let sortOption = { createdAt: -1 };
      if (sortBy === "budget") sortOption = { "budget.max": -1 };

      projects = await Projectpost.find(matchStage)
        .sort(sortOption)
        .limit(50);
    }

    // Add distance in km for frontend
    projects = projects.map(project => ({
      ...project,
      distance: project.distance ? (project.distance / 1000).toFixed(2) + " km" : null
    }));

    res.status(200).json({ 
      success: true,
      projects 
    });

  } catch (err) {
    console.error("Error in findWork:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};