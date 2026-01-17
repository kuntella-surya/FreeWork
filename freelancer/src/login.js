import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-card shadow-lg rounded">
        <h2 className="text-center mb-4 fw-bold text-primary">Welcome Back 👋</h2>
        <p className="text-center text-muted mb-4">Login to continue your journey</p>

        <div className="mb-3">
          <input
            type="email"
            className="form-control p-3"
            placeholder="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            className="form-control p-3"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
          Log In
        </button>

        <div className="text-center mt-4">
          <span className="text-muted">Don't have an account? </span>
          <Link to="/signup" className="text-primary fw-semibold">
            Sign up
          </Link>
        </div>
      </form>

      <style jsx>{`
        .login-page {
          height: 100vh;
          background: linear-gradient(135deg, #74ebd5, #acb6e5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 40px 35px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease-in-out;
        }

        .login-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        input.form-control {
          border-radius: 10px;
          border: 1px solid #d6d6d6;
          transition: 0.3s;
        }

        input.form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }

        button.btn-primary {
          border-radius: 10px;
          background: linear-gradient(90deg, #007bff, #00b4d8);
          border: none;
          transition: 0.3s;
        }

        button.btn-primary:hover {
          background: linear-gradient(90deg, #00b4d8, #007bff);
          transform: scale(1.03);
        }
      `}</style>
    </div>
  );
}

export default Login;
