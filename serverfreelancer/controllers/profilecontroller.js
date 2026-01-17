import FreelancerProfile from '../models/FreelancerProfile.js';

export const createProfile = async (req, res) => {
  try {
    const {
      name,
      uname,
      description,
      qualifications,
      skills,
      certifications,
      portfolio,
      workExperience,
    } = req.body; 
    console.log("Request Body:", req.body);

    const profilePicUrl = req.files['profilePic']
      ? `/uploads/${req.files['profilePic'][0].filename}`
      : '';
    const coverPicUrl = req.files['coverPic']
      ? `/uploads/${req.files['coverPic'][0].filename}`
      : '';
    const certificateUrls = req.files['certificates']
      ? req.files['certificates'].map((file) => `/uploads/${file.filename}`)
      : [];

    const newProfile = new FreelancerProfile({
      userId: req.user.id,
      name,
      uname,
      description,
      qualifications,
      skills: skills ? skills.split(',').map((s) => s.trim()) : [],
      certifications: certifications
        ? certifications.split(',').map((c) => c.trim())
        : [],
      profilePicUrl,
      coverPicUrl,
      certificateUrls,
      portfolio: portfolio ? JSON.parse(portfolio) : [],
      workExperience: workExperience ? JSON.parse(workExperience) : [],
    });

    await newProfile.save();
    res.status(201).json({ profile: newProfile });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ message: 'Server error while creating profile ok' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      description,
      qualifications,
      skills,
      certifications,
      portfolio,
      workExperience,
    } = req.body;

    const profilePicUrl = req.files['profilePic']
      ? `/uploads/${req.files['profilePic'][0].filename}`
      : undefined;
    const coverPicUrl = req.files['coverPic']
      ? `/uploads/${req.files['coverPic'][0].filename}`
      : undefined;
    const certificateUrls = req.files['certificates']
      ? req.files['certificates'].map((file) => `/uploads/${file.filename}`)
      : undefined;

    const updatedFields = {
      name,
      description,
      qualifications,
      skills: skills ? skills.split(',').map((s) => s.trim()) : [],
      certifications: certifications
        ? certifications.split(',').map((c) => c.trim())
        : [],
      portfolio: portfolio ? JSON.parse(portfolio) : [],
      workExperience: workExperience ? JSON.parse(workExperience) : [],
    };

    if (profilePicUrl) updatedFields.profilePicUrl = profilePicUrl;
    if (coverPicUrl) updatedFields.coverPicUrl = coverPicUrl;
    if (certificateUrls) updatedFields.certificateUrls = certificateUrls;

    const updatedProfile = await FreelancerProfile.findOneAndUpdate(
      { userId: req.user.id },
      updatedFields,
      { new: true }
    );

    res.status(200).json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};
