import Freelancerratings from "../models/freelancerrating.js";
import Project from "../models/Project.js";

// Submit rating
export const submitRating = async (req, res) => {
  const projectId = req.params.projectId;
  const clientId = req.user.id; // from auth middleware
  const { freelancerId, rating, feedback,ratedBy } = req.body;
  
  if (!freelancerId || !rating) {
    return res.status(400).json({ message: "Freelancer ID and rating are required." });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found." });

    if (project.assignedTo.toString() !== freelancerId) {
      return res.status(400).json({ message: "Freelancer not assigned to this project." });
    }

    const existingRating = await Freelancerratings.findOne({ projectId, freelancerId, clientId });
    if (existingRating) {
      return res.status(400).json({ message: "You have already rated this freelancer." });
    }

    const newRating = new Freelancerratings({
      projectId,
      freelancerId,
      clientId,
      ratedBy,
      rating,
      feedback,
    });

    await newRating.save();
    return res.status(200).json({ message: "Rating submitted successfully!", rating: newRating });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Get all ratings for a freelancer
export const getFreelancerRatings = async (req, res) => {
  const freelancerId = req.params.freelancerId;

  try {
    const ratings = await Freelancerratings.find({ freelancerId }).populate("clientId", "name profilePic");
    return res.status(200).json({ ratings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
export const getClientRatingForProject = async (req, res) => {
  try {
    const clientId = req.user.id; // Logged-in client
    const { projectId } = req.params;
    console.log("Fetching rating for project:", projectId, "by client:", clientId);
    const rating = await Freelancerratings.findOne({ projectId, clientId });

    if (!rating) {
      return res.status(200).json({ message: "No rating found", rating: null });
    }

    res.status(200).json({ rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};