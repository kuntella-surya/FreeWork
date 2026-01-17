// controllers/getprofile.js  ← this file
import FreelanceProfile from "../models/FreelancerProfile.js";

export const getFreelanceProfile = async (req, res) => {
  try {
    // Fix this line – use req.user.id (from JWT payload)
    const profile = await FreelanceProfile.findOne({ userId: req.user.id }); // ← was req.userId

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (err) {
    console.error("Error in getFreelanceProfile:", err);
    res.status(500).json({ message: 'Server error' });
  }
};