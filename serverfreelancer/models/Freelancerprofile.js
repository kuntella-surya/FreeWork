import mongoose from 'mongoose';

const freelancerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  uname: String,
  description: String,
  qualifications: String,
  skills: [String],
  certifications: [String],
  profilePicUrl: String,
  coverPicUrl: String,
  certificateUrls: [String],
  portfolio: [
    {
      title: String,
      link: String,
      description: String,
    },
  ],
  workExperience: [
    {
      position: String,
      company: String,
      duration: String,
    },
  ],
}, { timestamps: true });

export default mongoose.model('FreelancerProfile', freelancerProfileSchema);
