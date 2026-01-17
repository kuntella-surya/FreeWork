import express from "express";
import { submitRating, getClientRatingForProject } from "../controllers/ratingscontroler.js";
import { protect } from "../middleware/auth.js";
import { getFreelancerRatings } from "../controllers/ratingscontroler.js";

const router = express.Router();

// Submit rating for a project
router.post("/:projectId", protect, submitRating);

// Get rating given by current client for a project
router.get("/:projectId/client", protect, getClientRatingForProject);

// Get all ratings for a freelancer
router.get("/freelancer/:freelancerId", getFreelancerRatings);


export default router;
