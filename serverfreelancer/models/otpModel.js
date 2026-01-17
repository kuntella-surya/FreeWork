import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    target: { type: String, required: true }, // email or phone
    method: { type: String, enum: ["email", "phone"], required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-delete after 5 minutes
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);
