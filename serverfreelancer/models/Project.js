import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedName: { type: String },

  uname: {
    type: String,
    required: true,
  },

  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },

  skillsRequired: {
    type: [String],
    required: true,
  },

  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },

  // ✅ Duration field made structured
  duration: {
    value: { type: Number, required: true },
    unit: {
      type: String,
      enum: ["minutes", "hours", "days", "weeks", "months", "years", "full-time"],
      required: true,
    },
  },

  category: {
    type: String,
    enum: [
      "Plumbing",
      "Electrical",
      "Carpentry",
      "Painting",
      "Home Cleaning",
      "Appliance Repair",
      "AC Service & Repair",
      "Mobile Repair",
      "Bike Repair",
      "Car Repair",
      "Photography",
      "Event Management",
      "Gardening",
      "Pest Control",
      "Tuition / Coaching",
      "Tailoring",
      "Laundry",
      "Beauty & Salon",
      "Babysitting",
      "Pet Care",
      "Delivery & Pickup",
      "Construction",
      "Others",
    ],
    required: true,
  },

  projectType: {
    type: String,
    enum: ["fixed", "hourly"],
    default: "fixed",
  },

  // ✅ GEOJSON LOCATION FIELD
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },

  status: {
    type: String,
    enum: ["open", "in-progress", "completed", "cancelled"],
    default: "open",
  },

  createdAt: { type: Date, default: Date.now },
});

// ✅ Create geospatial index for near queries
projectSchema.index({ location: "2dsphere" });

const Projectpost = mongoose.model("Project", projectSchema);
export default Projectpost;
