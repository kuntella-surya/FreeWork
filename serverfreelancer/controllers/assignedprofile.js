import FreelanceProfile from "../models/FreelancerProfile.js";
export const getassignedFreelanceProfile = async (req, res) => {
  try {
    console.log("Fetching profile for userId:", req.params.id);
    const did = req.params.id;
    const profile = await FreelanceProfile.findOne({ userId: did });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
