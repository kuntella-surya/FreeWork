import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams } from "react-router-dom";
import Chart from 'chart.js/auto'; // Ensure Chart.js is installed

const ViewProfile = ({ currentUser }) => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    qualifications: "",
    uname: currentUser?.uname || "",
    skills: "",
    certifications: "",
    profilePic: null,
    coverPic: null,
    certificates: [],
    portfolio: [{ title: "", link: "", description: "" }],
    workExperience: [{ position: "", company: "", duration: "" }],
  });
  const [isEditing, setIsEditing] = useState(false);
  const token = localStorage.getItem("token");
  const chartRef = useRef(null);
  const chartInstance = useRef(null); // Ref to store the chart instance

  // Fetch and analyze sentiment from server
  const analyzeSentiment = async (text) => {
    if (!text) return { sentiment: "neutral", score: 0, flag: false };
    try {
      const res = await fetch("/ai/analyze-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      return { sentiment: "neutral", score: 0, flag: false };
    }
  };

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = id
          ? `/api/getassigned/${id}`
          : `/api/freelance-profile`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const profileData = data.profile;
          setProfile(profileData);
          setFormData({
            name: profileData.name || "",
            description: profileData.description || "",
            qualifications: profileData.qualifications || "",
            skills: profileData.skills ? profileData.skills.join(", ") : "",
            certifications: profileData.certifications
              ? profileData.certifications.join(", ")
              : "",
            profilePic: null,
            coverPic: null,
            certificates: [],
            portfolio: profileData.portfolio.length
              ? profileData.portfolio
              : [{ title: "", link: "", description: "" }],
            workExperience: profileData.workExperience.length
              ? profileData.workExperience
              : [{ position: "", company: "", duration: "" }],
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [id, token, currentUser]);

  // Fetch and analyze freelancer ratings
  useEffect(() => {
    const fetchRatings = async () => {
      if (!profile?.userId) return;
      try {
        const res = await fetch(
          `/api/rating/freelancer/${profile.userId}`
        );
        const data = await res.json();
        console.log("Fetched ratings:", data);
        if (res.ok) {
          const analyzedRatings = await Promise.all(
            (data.ratings || []).map(async (r) => ({
              ...r,
              ...(await analyzeSentiment(r.feedback || "")),
            }))
          );
          setRatings(analyzedRatings);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
      }
    };
    fetchRatings();
  }, [profile]);

  // Calculate overall sentiment and star rating
  const calculateOverallRating = () => {
    if (ratings.length === 0) return { averageRating: 0, positiveCount: 0, negativeCount: 0 };
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;
    const sentimentCounts = ratings.reduce(
      (acc, r) => {
        acc[r.sentiment === "positive" ? "positiveCount" : r.sentiment === "negative" ? "negativeCount" : "neutralCount"] += 1;
        return acc;
      },
      { positiveCount: 0, negativeCount: 0, neutralCount: 0 }
    );
    return {
      averageRating: Number(averageRating.toFixed(1)),
      ...sentimentCounts,
    };
  };

  const { averageRating, positiveCount, negativeCount } = calculateOverallRating();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePic" || name === "coverPic") {
      setFormData({ ...formData, [name]: files[0] });
    } else if (name === "certificates") {
      setFormData({ ...formData, certificates: Array.from(files) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePortfolioChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.portfolio];
    updated[index][name] = value;
    setFormData({ ...formData, portfolio: updated });
  };

  const handleWorkExperienceChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.workExperience];
    updated[index][name] = value;
    setFormData({ ...formData, workExperience: updated });
  };

  const addPortfolioItem = () => {
    setFormData({
      ...formData,
      portfolio: [...formData.portfolio, { title: "", link: "", description: "" }],
    });
  };

  const addWorkExperienceItem = () => {
    setFormData({
      ...formData,
      workExperience: [...formData.workExperience, { position: "", company: "", duration: "" }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const multipartForm = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "portfolio" || key === "workExperience") {
        multipartForm.append(key, JSON.stringify(value));
      } else if (key === "certificates") {
        value.forEach((file) => multipartForm.append("certificates", file));
      } else if (value !== null) {
        multipartForm.append(key, value);
      }
    });

    try {
      const res = await fetch(
        profile
          ? `/api/update-profile`
          : `/api/create-profile`,
        {
          method: profile ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: multipartForm,
        }
      );
      const result = await res.json();
      if (res.ok) {
        alert(`Profile ${profile ? "updated" : "created"} successfully`);
        setProfile(result.profile);
        setIsEditing(false);
      } else {
        alert(result.message || `Error ${profile ? "updating" : "creating"} profile`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  // Render chart when ratings change and clean up on unmount/update
  useEffect(() => {
    if (chartRef.current && ratings.length > 0) {
      // Destroy existing chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Positive', 'Negative', 'Neutral'],
          datasets: [{
            data: [positiveCount, negativeCount, ratings.length - positiveCount - negativeCount],
            backgroundColor: ['#4CAF50', '#F44336', '#FFEB3B']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Sentiment Distribution' }
          }
        }
      });
    }

    // Cleanup chart on unmount or when dependencies change
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [ratings, positiveCount, negativeCount]);

  // ---------- VIEW MODE ----------
  if (profile && !isEditing) {
    return (
      <div className="container mt-4">
        <div className="card shadow-lg border-0" style={{ borderRadius: "15px", overflow: "hidden" }}>
          <div
            className="position-relative"
            style={{
              height: "250px",
              backgroundImage: `ur[](${profile.coverPicUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <img
              src={`${profile.profilePicUrl}`}
              alt="Profile"
              className="rounded-circle shadow position-absolute"
              style={{
                width: "150px",
                height: "150px",
                bottom: "-75px",
                left: "50%",
                transform: "translateX(-50%)",
                border: "5px solid white",
                objectFit: "cover",
              }}
            />
          </div>

          <div className="card-body mt-5 text-center">
            <h2 className="fw-bold">{profile.name}</h2>
            <p className="text-muted">{profile.qualifications}</p>
            <p className="mt-3">{profile.description}</p>

            {/* Skills */}
            <div className="mt-4 text-start">
              <h5 className="fw-semibold">Skills</h5>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {profile.skills.map((s, i) => (
                  <span key={i} className="badge bg-primary rounded-pill px-3 py-2 fs-6">{s}</span>
                ))}
              </div>

              {/* Certifications */}
              <h5 className="fw-semibold">Certifications</h5>
              <ul>
                {profile.certifications.map((c, i) => <li key={i}>{c}</li>)}
              </ul>

              {/* Portfolio */}
              <h5 className="fw-semibold mt-4">Portfolio</h5>
              {profile.portfolio.map((p, i) => (
                <div key={i} className="card my-3 shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="fw-bold">{p.title}</h6>
                    <a href={p.link} target="_blank" rel="noreferrer">{p.link}</a>
                    <p className="text-muted mt-2">{p.description}</p>
                  </div>
                </div>
              ))}

              {/* Work Experience */}
              <h5 className="fw-semibold mt-4">Work Experience</h5>
              {profile.workExperience.map((w, i) => (
                <div key={i} className="card my-3 shadow-sm border-0">
                  <div className="card-body">
                    <h6 className="fw-bold mb-1">{w.position}</h6>
                    <p className="mb-0">{w.company} — <span className="text-muted">{w.duration}</span></p>
                  </div>
                </div>
              ))}

              {/* Overall Rating and Sentiment */}
              <div className="mt-5">
                <h4 className="fw-bold text-center mb-4">⭐ Overall Freelancer Rating</h4>
                <div className="text-center mb-3">
                  <h5>Average Rating: {averageRating} ★</h5>
                  <p>
                    <span role="img" aria-label="positive">😊 {positiveCount} Positive</span> | 
                    <span role="img" aria-label="negative">😞 {negativeCount} Negative</span>
                  </p>
                  <canvas ref={chartRef} style={{ maxWidth: "300px", margin: "0 auto" }}></canvas>
                </div>

                {/* Ratings Section */}
                <h4 className="fw-bold text-center mb-4">⭐ Freelancer Reviews</h4>
                {ratings.length > 0 ? (
                  <div className="">
                    {ratings.map((r, i) => (
                      <div key={i} className="mb-4">
                        <div
                          className="card shadow border-0 h-100"
                          style={{
                            borderRadius: "20px",
                            background: "linear-gradient(145deg, #ffffff, #f9f9f9)",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-5px)";
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
                          }}
                        >
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <h6 className="fw-bold mb-0 text-capitalize">
                                👤 Rated by: <span className="text-primary">{r.ratedBy || r.clientName}</span>
                              </h6>
                              <span className="text-muted small">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  style={{
                                    fontSize: "1.4rem",
                                    color: star <= r.rating ? "#ffc107" : "#e4e5e9",
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>

                            <p className="fst-italic text-muted" style={{ minHeight: "40px" }}>
                              {r.feedback || r.comment ? `"${r.feedback || r.comment}"` : "No feedback provided"}
                            </p>

                            <p className="text-info">
                              Sentiment: {r.sentiment} {r.flag ? '(Flagged for moderation)' : ''}
                            </p>

                            <div className="text-end mt-2">
                              <span className="badge bg-light text-dark border">
                                Project ID: <strong>{r.projectId?.slice(-6)}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted">No ratings yet</p>
                )}
              </div>

              <button className="btn btn-outline-primary mt-4 px-4" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- EDIT/CREATE MODE ----------
  return (
    <div className="container py-4">
      <div className="card shadow-lg p-4 border-0" style={{ borderRadius: "15px" }}>
        <h3 className="text-center fw-bold mb-4">{profile ? "Edit Freelance Profile" : "Create Freelance Profile"}</h3>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="row g-3">
            <div className="col-md-6">
              <input type="text" className="form-control" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <input type="text" className="form-control" name="qualifications" placeholder="Qualifications" value={formData.qualifications} onChange={handleChange} />
            </div>
            <div className="col-12">
              <textarea className="form-control" rows="3" name="description" placeholder="Professional Summary" value={formData.description} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <input type="text" className="form-control" name="skills" placeholder="Skills (comma separated)" value={formData.skills} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <input type="text" className="form-control" name="certifications" placeholder="Certifications (comma separated)" value={formData.certifications} onChange={handleChange} />
            </div>

            {/* Portfolio */}
            <div className="col-12 mt-3">
              <h5>Portfolio</h5>
              {formData.portfolio.map((item, index) => (
                <div key={index} className="border rounded p-3 mb-3">
                  <input type="text" className="form-control mb-2" name="title" placeholder="Title" value={item.title} onChange={(e) => handlePortfolioChange(index, e)} />
                  <input type="text" className="form-control mb-2" name="link" placeholder="Link" value={item.link} onChange={(e) => handlePortfolioChange(index, e)} />
                  <textarea className="form-control" name="description" placeholder="Description" value={item.description} onChange={(e) => handlePortfolioChange(index, e)} />
                </div>
              ))}
              <button type="button" className="btn btn-outline-success" onClick={addPortfolioItem}>+ Add Portfolio Item</button>
            </div>

            {/* Work Experience */}
            <div className="col-12 mt-4">
              <h5>Work Experience</h5>
              {formData.workExperience.map((item, index) => (
                <div key={index} className="border rounded p-3 mb-3">
                  <input type="text" className="form-control mb-2" name="position" placeholder="Position" value={item.position} onChange={(e) => handleWorkExperienceChange(index, e)} />
                  <input type="text" className="form-control mb-2" name="company" placeholder="Company" value={item.company} onChange={(e) => handleWorkExperienceChange(index, e)} />
                  <input type="text" className="form-control" name="duration" placeholder="Duration" value={item.duration} onChange={(e) => handleWorkExperienceChange(index, e)} />
                </div>
              ))}
              <button type="button" className="btn btn-outline-success" onClick={addWorkExperienceItem}>+ Add Work Experience</button>
            </div>

            {/* Uploads */}
            <div className="col-12 mt-4">
              <label className="form-label">Profile Picture</label>
              <input type="file" className="form-control" name="profilePic" onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Cover Picture</label>
              <input type="file" className="form-control" name="coverPic" onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Certificates</label>
              <input type="file" className="form-control" name="certificates" multiple onChange={handleChange} />
            </div>

            <div className="text-center mt-4">
              <button type="submit" className="btn btn-primary px-5">{profile ? "Update Profile" : "Create Profile"}</button>
              {profile && <button type="button" className="btn btn-outline-secondary ms-3 px-5" onClick={() => setIsEditing(false)}>Cancel</button>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewProfile;