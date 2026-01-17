import User from "../models/User.js";
import Projectpost from "../models/Project.js";

export const postProject = async (req, res) => {
  try {
    const {
      title,
      description,
      skillsRequired,
      minBudget,
      maxBudget,
      durationValue,
      durationUnit,
      category,
      projectType,
      latitude,
      longitude,
      manualLocation,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Convert skills to array
    const skillsArray = Array.isArray(skillsRequired)
      ? skillsRequired
      : skillsRequired.split(",").map((skill) => skill.trim());

    // ✅ Build location object
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location coordinates are required" });
    }

    const location = {
      type: "Point",
      coordinates: [longitude, latitude],
      address: manualLocation || "",
    };

    // ✅ Build duration object
    const duration = {
      value: Number(durationValue),
      unit: durationUnit,
    };

    const project = new Projectpost({
      clientId: req.user.id,
      uname: user.uname,
      title,
      description,
      skillsRequired: skillsArray,
      budget: { min: minBudget, max: maxBudget },
      duration,
      category,
      projectType,
      location,
    });

    await project.save();
    res.status(201).json({ message: "Project posted successfully", project });
  } catch (err) {
    console.error("Error posting project:", err);
    res.status(500).json({ message: "Server error while posting project", error: err });
  }
};
