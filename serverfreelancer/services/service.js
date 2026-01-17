import Otp from "../models/otpModel.js";
import crypto from "crypto";
import { sendEmail } from "../utils/mailer.js"; // ✅ import mailer

const sendOtp = async (req, res) => {
  try {
    const { target, method } = req.body;

    if (!["email", "phone"].includes(method)) {
      return res.status(400).json({ message: "Invalid method" });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // save hashed otp
    const otpDoc = new Otp({
      target,
      method,
      otp: hashedOtp,
    });

    await otpDoc.save();

    if (method === "email") {
      await sendEmail(
        target,
        "Your OTP for Verification",
        `Your OTP code is: ${otp}. It will expire in 5 minutes.`
      );
    }

    console.log(`OTP for ${target}: ${otp}`);
    res.json({ message: `OTP sent to ${target}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};


// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { target, otp } = req.body;
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const record = await Otp.findOne({ target }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (record.otp !== hashedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // delete OTPs for this target after successful verification
    await Otp.deleteMany({ target });

    return res.json({ success: true, message: "OTP verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

// ✅ Only one export statement
export { sendOtp, verifyOtp };
