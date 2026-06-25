import { useEffect, useState } from "react";
import { Spinner, Alert, Badge, Button, Modal } from "react-bootstrap";
import {
  FaMoneyBillWave,
  FaClock,
  FaTools,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaRegEye,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./myprocject.css";

function MyProjects() {
  const token = localStorage.getItem("token");
  console.log("Using token:", token);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/project/getp`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects);
      } else {
        setError(data.message || "Failed to fetch projects");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      console.log(
        "Attempting to delete project ID:",
        selectedProject._id,
        "Token:",
        token
      );

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/project/delete/${selectedProject._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text, "Status:", res.status);
        throw new Error(`Server returned non-JSON response (status: ${res.status})`);
      }

      const data = await res.json();
      if (res.ok) {
        setProjects((prev) =>
          prev.filter((proj) => proj._id !== selectedProject._id)
        );
        setShowDeleteModal(false);
        alert("Project deleted successfully");
      } else {
        console.error("Delete failed:", data);
        alert(data.message || "Failed to delete project.");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(`Error deleting project: ${error.message}`);
    }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold display-6 gradient-text">📁 My Posted Projects</h2>
        <p className="text-muted">
          Manage and monitor all your posted projects efficiently.
        </p>
      </div>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && projects.length === 0 && (
        <Alert variant="info" className="text-center shadow-sm">
          You haven’t posted any projects yet.
        </Alert>
      )}

      <div className="project-list-vertical">
        {projects.map((project) => (
          <div
            className="project-card-vertical shadow-sm border rounded-4 p-4 mb-4"
            key={project._id}
          >
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h4 className="text-primary fw-bold mb-1">{project.title}</h4>
                <div>
                  <Badge bg="secondary" className="me-2">
                    {project.category || "Uncategorized"}
                  </Badge>
                  <Badge bg="info">{project.projectType || "N/A"}</Badge>
                </div>
              </div>

              <Badge
                bg={
                  project.status === "open"
                    ? "success"
                    : project.status === "in-progress"
                    ? "primary"
                    : project.status === "completed"
                    ? "dark"
                    : "danger"
                }
                className="px-3 py-2"
              >
                {project.status ? project.status.toUpperCase() : "UNKNOWN"}
              </Badge>
            </div>

            <p className="text-muted mb-3">
              {project.description && project.description.length > 150
                ? project.description.slice(0, 150) + "..."
                : project.description || "No description available."}
            </p>

            <div className="project-details">
              <div className="detail-item">
                <FaMoneyBillWave className="text-success me-2" />
                <strong>Budget:</strong> ₹
                {project.budget?.min || 0} - ₹{project.budget?.max || 0}
              </div>

              <div className="detail-item">
                <FaClock className="text-warning me-2" />
                <strong>Duration:</strong>{" "}
                {project.duration?.value
                  ? `${project.duration.value} ${project.duration.unit || "days"}`
                  : `${project.duration || "N/A"}`}
              </div>

              <div className="detail-item">
                <FaTools className="text-primary me-2" />
                <strong>Skills:</strong>{" "}
                {Array.isArray(project.skillsRequired)
                  ? project.skillsRequired.slice(0, 4).join(", ")
                  : project.skillsRequired || "N/A"}
              </div>

              <div className="detail-item">
                <FaMapMarkerAlt className="text-danger me-2" />
                <strong>Location:</strong>{" "}
                {project.location?.address || "Remote"}
              </div>

              <div className="detail-item">
                <FaCalendarAlt className="text-muted me-2" />
                <strong>Posted:</strong>{" "}
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "Unknown"}
              </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="d-flex justify-content-end mt-3 gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => navigate(`/project/edit/${project._id}`)}
              >
                <FaEdit className="me-1" /> Edit
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  setSelectedProject(project);
                  setShowDeleteModal(true);
                }}
              >
                <FaTrash className="me-1" /> Delete
              </Button>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() =>
                  navigate(`/project/proposals/${project._id}`)
                }
              >
                <FaRegEye className="me-1" /> View Bids
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the project{" "}
          <strong>{selectedProject?.title}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MyProjects;
