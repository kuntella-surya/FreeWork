import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

export default function Verification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData } = location.state || {}; // 👈 get formData from navigate

  const [otp, setOtp] = useState("");
  const [method, setMethod] = useState("email");
  const [message, setMessage] = useState("");
    
  const handleSendOtp = async () => {
    try {
      const target =
        method === "email" ? formData?.email : formData?.phno;

      // call backend API to send 
      
      const res = await fetch("${process.env.REACT_APP_API_URL}/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, method }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`OTP sent to ${target}`);
      } else {
        setMessage(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error while sending OTP");
    }
  };

  const handleVerify = async () => {
    try {
           const res = await fetch("${process.env.REACT_APP_API_URL}/api/verify-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    target: formData.email,  // ✅ use target, not email
    otp: otp,
  }),
});

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ OTP verified successfully!");
        // redirect to dashboard or save token
        navigate("/signup");
      } else {
        setMessage(data.message || "❌ Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error while verifying OTP");
    }
  };

  const switchMethod = () => {
    setMethod(method === "email" ? "phone" : "email");
    setOtp("");
    setMessage("");
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 otp-bg">
      <div className="card shadow p-4 otp-card">
        <h2 className="text-center mb-3">OTP Verification</h2>
        <p className="text-center text-muted">
          Enter the OTP sent to your{" "}
          {method === "email" ? formData?.email : formData?.phno}
        </p>

        {message && <div className="alert alert-info">{message}</div>}

        <div className="mb-3">
          <input
            type="text"
            className="form-control text-center fs-4"
            maxLength="6"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/, ""))}
          />
        </div>

        <button
          className="btn btn-success w-100 mb-2"
          onClick={handleSendOtp}
        >
          Send OTP via {method === "email" ? "Email" : "Phone"}
        </button>

        <button
          className="btn btn-primary w-100 mb-3"
          onClick={handleVerify}
        >
          Verify
        </button>

        <p
          className="text-center text-decoration-underline text-primary"
          style={{ cursor: "pointer" }}
          onClick={switchMethod}
        >
          Try another way
        </p>
      </div>
    </div>
  );
}
