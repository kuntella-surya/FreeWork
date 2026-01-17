import { sendOtp, verifyOtp } from "../services/service.js";
import User from "../models/userModel.js";

const sendOtpController = async (req, res) => {
  try {
    const { target, method } = req.body;
    console.log("sendOtpController called with:", req.body);
    if (!target) return res.status(400).json({ message: "Target required" });

    await sendOtp({ target, method });

    res.status(200).json({ message: `OTP sent to ${target}` });
  } catch (err) {
    console.error("sendOtpController error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOtp({ email, otp });
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // mark user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    res.status(200).json({ message: "OTP verified", user });
  } catch (err) {
    console.error("verifyOtpController error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export { sendOtpController, verifyOtpController };
