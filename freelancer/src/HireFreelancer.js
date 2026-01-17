import React, { useEffect, useState } from "react";
import { Spinner, Card, Button, Form, Badge } from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaUser,
  FaRegEye,
  FaComments,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./HireFreelancer.css";

export default function HireFreelancer({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [sortBy]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/project/getp`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        const sorted = sortProjects(data.projects, sortBy);
        setProjects(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const sortProjects = (projects, criteria) => {
    const sorted = [...projects];
    switch (criteria) {
      case "budget":
        return sorted.sort((a, b) => (b.budget?.max || 0) - (a.budget?.max || 0));
      case "location":
        return sorted.sort((a, b) =>
          (a.location?.address || "").localeCompare(b.location?.address || "")
        );
      case "duration":
        return sorted.sort(
          (a, b) =>
            (parseInt(a.duration?.value || a.duration || 0)) -
            (parseInt(b.duration?.value || b.duration || 0))
        );
      default:
        return sorted.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }
  };

  return (
    <div className="hirefreelancer-page container py-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold display-6 gradient-text">Find Your Next Project</h2>
        <p className="text-muted">
          Browse exciting freelance projects and start bidding!
        </p>

        <Form.Select
          className="mt-3 shadow-sm mx-auto w-auto d-inline-block"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sort by: Date Posted</option>
          <option value="budget">Sort by: Budget</option>
          <option value="location">Sort by: Location</option>
          <option value="duration">Sort by: Duration</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-2">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <h5>No projects found!</h5>
        </div>
      ) : (
        <div className="row g-4">
          {projects.map((project) => (
            <div className="col-md-6 col-lg-4" key={project._id}>
              <Card className="project-card h-100 shadow-lg border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Title className="fw-bold text-primary">
                        {project.title}
                      </Card.Title>
                      <Card.Subtitle className="text-muted small mb-2">
                        <Badge bg="info" className="me-2">
                          {project.category || "General"}
                        </Badge>
                        <Badge bg="secondary">{project.projectType || "N/A"}</Badge>
                      </Card.Subtitle>
                    </div>
                  </div>

                  <Card.Text className="desc-trim text-dark small">
                    {project.description?.length > 120
                      ? project.description.slice(0, 120) + "..."
                      : project.description || "No description provided."}
                  </Card.Text>

                  <ul className="list-unstyled mt-3 small">
                    <li>
                      <FaMoneyBillWave className="text-success me-2" />
                      <strong>Budget:</strong> ₹{project.budget?.min || 0} - ₹
                      {project.budget?.max || 0}
                    </li>
                    <li>
                      <FaClock className="text-warning me-2" />
                      <strong>Duration:</strong>{" "}
                      {project.duration?.value
                        ? `${project.duration.value} ${project.duration.unit || ""}`
                        : project.duration || "N/A"}
                    </li>
                    <li>
                      <FaMapMarkerAlt className="text-danger me-2" />
                      <strong>Location:</strong>{" "}
                      {project.location?.address
                        ? project.location.address
                        : project.location?.coordinates
                        ? `Lat: ${project.location.coordinates[1]}, Lng: ${project.location.coordinates[0]}`
                        : "Remote"}
                    </li>
                  </ul>

                  <div className="skills mt-3">
                    {project.skillsRequired &&
                      (Array.isArray(project.skillsRequired)
                        ? project.skillsRequired
                        : project.skillsRequired.split(",")
                      )
                        .slice(0, 4)
                        .map((skill, i) => (
                          <Badge
                            key={i}
                            bg="light"
                            text="dark"
                            className="me-1 mb-1 skill-badge"
                          >
                            {skill.trim()}
                          </Badge>
                        ))}
                  </div>
                </Card.Body>

                <Card.Footer className="bg-transparent border-top-0 d-flex justify-content-between align-items-center">
                  <div className="text-muted small d-flex align-items-center">
                    <FaUser className="me-1" /> {project.uname || "Client"}
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() =>
                        navigate(`/project/proposals/${project._id}`)
                      }
                    >
                      <FaRegEye className="me-1" />
                      View
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() =>
                        navigate(`/chat/${project.clientId}`, {
                          state: {
                            otherUserName: project.uname,
                            projectId: project._id,
                          },
                        })
                      }
                      title="Start Chat"
                    >
                      <FaComments className="me-1" /> Chat
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
