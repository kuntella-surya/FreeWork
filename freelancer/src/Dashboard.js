import React, { useEffect, useState } from "react";
import useAuth from "./useAuth";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import "./Dashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Dashboard({ currentUser }) {
  const isAuth = useAuth();
  const [data, setData] = useState({});
  const [barChart, setBarChart] = useState({ labels: [], data: [] });
  const [doughnutChart, setDoughnutChart] = useState({ labels: [], data: [] });
  const [darkMode, setDarkMode] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!currentUser?._id) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard/${currentUser._id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };

    fetchStats();
  }, [token, currentUser]);

  useEffect(() => {
    if (!currentUser?._id) return;

    const fetchChartData = async () => {
      try {
        const res = await fetch(`/api/charts/${currentUser._id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const chartData = await res.json();
        setBarChart(chartData.bar);
        setDoughnutChart(chartData.doughnut);
      } catch (error) {
        console.error("Failed to fetch chart data", error);
      }
    };

    fetchChartData();
  }, [token, currentUser]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  const stats = [
    { label: "Active Projects", value: data.activeProjects || 0 },
    { label: "Notifications", value: data.notifications || 0 },
    { label: "Freelancers Hired", value: data.hired || 0 },
  ];

  const barData = {
    labels: barChart.labels,
    datasets: [
      {
        label: "Projects Posted per Month",
        data: barChart.data,
        backgroundColor: "#00b894",
      },
    ],
  };

  const doughnutData = {
    labels: doughnutChart.labels,
    datasets: [
      {
        label: "Freelancer Categories",
        data: doughnutChart.data,
        backgroundColor: ["#fdcb6e", "#0984e3", "#e17055", "#6c5ce7", "#00cec9", "#d63031"],
      },
    ],
  };

  if (!currentUser) {
    return <div className="text-center mt-5">Loading user data...</div>;
  }

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : ""}`}>
      <div className="dashboard-header">
        <h1>Welcome {currentUser.uname || "User"}</h1>
        <button className="toggle-btn" onClick={toggleDarkMode}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="stats-section">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h4>Project Trends</h4>
          <Bar data={barData} />
        </div>
        <div className="chart-container">
          <h4>Freelancer Skill Distribution</h4>
          <Doughnut data={doughnutData} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
