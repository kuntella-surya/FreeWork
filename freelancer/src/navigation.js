import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { io } from "socket.io-client";
import { useUnread } from "./UnreadContext";
import { getCurrentUser } from "./getCurrentuser";
import Home from "./home";
import Login from "./login";
import Signup from "./signup";
import Dashboard from "./Dashboard";
import Profile from "./profile";
import SearchResults from "./searchresults";
import Settings from "./settings";
import Membership from "./Membership";
import ViewProfile from "./viewproflie";
import PostProject from "./postproject";
import MyProjects from "./myprojects";
import FindWork from "./findwork";
import Solutions from "./Solutions";
import HireFreelancer from "./HireFreelancer";
import ProjectDetails from "./projectDetails";
import ProjectProposals from "./ProjectProposals";
import ChatPage from "./chatPage";
import MessagesList from "./MessagesList";
import Notifications from "./notification";
import Verification from "./otp";
import EditProject from "./editproject";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";
import { AiFillHome } from 'react-icons/ai';
import { IoPerson, IoChatboxEllipses, IoNotifications, IoSearch } from "react-icons/io5";
import { FaUserTie, FaBriefcase, FaTasks } from "react-icons/fa";
import { MdPostAdd, MdSupportAgent } from "react-icons/md";
import { FiLogIn, FiLogOut, FiUserPlus } from "react-icons/fi";

const socket = io("http://localhost:5001");

function Header({ isLoggedIn, onLogout, currentUser, notificationCount }) {
  const { unreadTotal, setUnreadTotal } = useUnread();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [freelancerSkills, setFreelancerSkills] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch freelancer profile skills
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!currentUser?._id || !token) return;
    async function fetchProfile() {
      try {
        const res = await fetch(`http://localhost:5001/api/freelance-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFreelancerSkills(data.profile?.skills || []);
        } else {
          console.error("Failed to fetch profile, status:", res.status);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
      }
    }
    fetchProfile();
  }, [currentUser]);

  // Fetch unread messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!currentUser?._id) return;
    async function fetchUnread() {
      try {
        const res = await fetch(
          `http://localhost:5001/api/conversations/${currentUser._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const total = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadTotal(total);
        } else {
          console.error("Failed to fetch unread messages, status:", res.status);
        }
      } catch (e) {
        console.error("Failed to fetch unread count:", e);
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [currentUser, setUnreadTotal]);

  // Fetch recommended jobs on typing
  useEffect(() => {
    if (searchQuery) {
      fetch("http://localhost:5000/recommend-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ query: searchQuery, skills: freelancerSkills }),
      })
        .then((res) => {
          console.log("Recommend jobs response status:", res.status);
          return res.json();
        })
        .then((data) => {
          console.log("Recommended jobs:", data.suggestions);
          setRecommendedJobs(data.suggestions || []);
        })
        .catch((err) => {
          console.error("Error fetching recommended jobs:", err);
          setRecommendedJobs([]);
        });
    } else {
      setRecommendedJobs([]);
    }
  }, [searchQuery, freelancerSkills]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    console.log("Search input focused, isSearchFocused:", true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchFocused(false);
      console.log("Search input blurred, isSearchFocused:", false);
    }, 500); // Increased to 500ms
  };

  return (
    <>
      {/* Top Header Section */}
      <header className={`top-header ${isSearchFocused ? 'search-focused' : ''}`}>
        <div className="container-fluid px-4 d-flex justify-content-between align-items-center">
          <Link className="navbar-brand text-warning fw-bold fs-4" to="/">
            Free<span className="text-white">Work</span>
          </Link>
          <div className="search-container">
            <form className="search-group" onSubmit={handleSearchSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search jobs or freelancers..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  autoComplete="off"
                />
                <span className="input-group-text search-icon">
                  <IoSearch />
                </span>
              </div>
            </form>
            {isSearchFocused && recommendedJobs.length > 0 && (
              <div className="suggestions-dropdown">
                {recommendedJobs.map((job) => {
                  console.log("Rendering job suggestion:", job.job_id, job.title);
                  return (
                    <div
                      key={job.job_id}
                      className="suggestion-item"
                      onClick={() => {
                        console.log("Navigating to related-jobs for job_id:", job.job_id);
                        navigate(`/related-jobs/${job.job_id}?query=${encodeURIComponent(searchQuery)}`);
                        setSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                    >
                      <div className="suggestion-content">
                        <span className="suggestion-title">{job.title}</span>
                        <span className="suggestion-desc">{job.description.substring(0, 60)}...</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="user-actions d-flex align-items-center gap-3">
            {isLoggedIn ? (
              <>
                <NavLink className="btn btn-outline-light btn-sm d-flex align-items-center" to="/profile">
                  <IoPerson className="me-1" /> Profile
                </NavLink>
                <button
                  className="btn btn-success text-white d-flex align-items-center post-btn"
                  onClick={() => navigate("/postproject")}
                >
                  <MdPostAdd className="me-1 fs-5" /> Post Project
                </button>
                <button className="btn logout-btn d-flex align-items-center" onClick={onLogout}>
                  <FiLogOut className="me-1" /> Logout
                </button>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link className="btn btn-outline-light btn-sm" to="/login">
                  <FiLogIn className="me-1" /> Log in
                </Link>
                <Link className="btn btn-warning btn-sm text-dark fw-semibold" to="/signup">
                  <FiUserPlus className="me-1" /> Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation Icons */}
      <nav className="bottom-nav">
        <div className="container-fluid px-4 d-flex justify-content-around align-items-center">
          <NavLink className="nav-icon" to="/">
            <AiFillHome /> <span>Home</span>
          </NavLink>
          <NavLink className="nav-icon" to="/hirefreelancer">
            <FaUserTie /> <span>Hire</span>
          </NavLink>
          <NavLink className="nav-icon" to="/findwork">
            <FaBriefcase /> <span>Browse</span>
          </NavLink>
          <NavLink className="nav-icon" to="/solutions">
            <MdSupportAgent /> <span>Solutions</span>
          </NavLink>
          {isLoggedIn && (
            <>
              <NavLink className="nav-icon" to="/myprojects">
                <FaTasks /> <span>Projects</span>
              </NavLink>
              <NavLink className="nav-icon position-relative" to="/messages">
                <IoChatboxEllipses />
                {unreadTotal > 0 && (
                  <span className="badge bg-danger rounded-pill">{unreadTotal}</span>
                )}
                <span>Messages</span>
              </NavLink>
              <NavLink className="nav-icon position-relative" to="/notifications">
                <IoNotifications />
                {notificationCount > 0 && (
                  <span className="badge bg-danger rounded-pill">{notificationCount}</span>
                )}
                <span>Notifications</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
function RelatedJobs() {
  const { jobId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const queryParams = new URLSearchParams(search);
  const query = queryParams.get("query");

  useEffect(() => {
    async function fetchRelatedJobs() {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching related jobs for jobId:", jobId, "query:", query);
        const res = await fetch(`http://localhost:5000/related-jobs/${jobId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ query, skills: [] }),
        });
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        console.log("Related jobs response:", data);
        setRelatedJobs(data.suggestions || []);
      } catch (err) {
        console.error("Error fetching related jobs:", err);
        setError("Failed to load related jobs. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    if (jobId && query) {
      fetchRelatedJobs();
    } else {
      setError("Invalid job ID or query.");
      setIsLoading(false);
    }
  }, [jobId, query]);

  return (
    <div className="container mt-4">
      <h2>Related Jobs for "{query || "N/A"}"</h2>
      {isLoading ? (
        <p>Loading related jobs...</p>
      ) : error ? (
        <p>{error}</p>
      ) : relatedJobs.length > 0 ? (
        <div className="row">
          {relatedJobs.map((job) => (
            <div key={job.job_id} className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{job.title}</h5>
                  <p className="card-text">{job.description}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/project/${job.job_id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>
          No related jobs found for "{query || "N/A"}".{" "}
          <Link to="/findwork">Browse all jobs</Link>.
        </p>
      )}
    </div>
  );
}

export default function NavWrapper() {
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loadingUser, setLoadingUser] = useState(true);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");
      if (!token) {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setLoadingUser(false);
        return;
      }
      try {
        const user = await getCurrentUser();
        if (user?._id) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("token");
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } catch {
        localStorage.removeItem("token");
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setLoadingUser(false);
    }
    loadUser();
  }, [location.pathname]);

  useEffect(() => {
    if (currentUser?._id) {
      socket.emit("register", currentUser._id);
    }
    socket.on("newNotification", () => {
      setNotificationCount((prev) => prev + 1);
    });
    return () => socket.off("newNotification");
  }, [currentUser]);

  if (loadingUser) return <div className="text-center mt-5">Loading...</div>;

  return (
    <>
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        currentUser={currentUser}
        notificationCount={notificationCount}
      />
      {!loadingUser && (
        <Routes>
          <Route path="/" element={isLoggedIn ? <Dashboard currentUser={currentUser} /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/otp" element={<Verification />} />
          <Route path="/hirefreelancer" element={<HireFreelancer currentUser={currentUser} />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/dashboard" element={<Dashboard currentUser={currentUser} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/viewprofile" element={<ViewProfile currentUser={currentUser} />} />
          <Route path="/viewprofile/:id" element={<ViewProfile currentUser={currentUser} />} />
          <Route path="/postproject" element={<PostProject />} />
          <Route path="/myprojects" element={<MyProjects />} />
          <Route path="/findwork" element={<FindWork />} />
          <Route path="/project/:projectId" element={<ProjectDetails />} />
          <Route path="/project/edit/:id" element={<EditProject />} />
          <Route path="/project/proposals/:projectId" element={<ProjectProposals currentUser={currentUser} />} />
          <Route path="/chat/:otherUserId" element={<ChatPage currentUser={currentUser} />} />
          <Route path="/messages" element={<MessagesList currentUser={currentUser} />} />
          <Route path="/notifications" element={<Notifications setNotificationCount={setNotificationCount} />} />
          <Route path="/related-jobs/:jobId" element={<RelatedJobs />} />
        </Routes>
      )}
    </>
  );
}