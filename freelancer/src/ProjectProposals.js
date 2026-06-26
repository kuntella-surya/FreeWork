import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Spinner,
  Badge,
  Alert,
  Modal,
  Container,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import { FaUserCheck, FaRegClock, FaDollarSign, FaUndo } from "react-icons/fa";
import "./ProjectProposals.css";

export default function ProjectProposals(props) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [assignedFreelancer, setAssignedFreelancer] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  // Rating states
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [existingRating, setExistingRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/project/${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          const updatedProposals = await Promise.all(
            (data.proposals || []).map(async (proposal) => {
              if (proposal.freelancerId) {
                const freelancerRes = await fetch(
                  `/api/cur/${proposal.freelancerId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const freelancerData = await freelancerRes.json();
                return {
                  ...proposal,
                  freelancerPhoto: freelancerData.photoUrl || "https://placehold.co/50x50",
                };
              }
              return { ...proposal, freelancerPhoto: "https://placehold.co/50x50" };
            })
          );
          setProject({
            ...data.project,
            proposals: updatedProposals,
            clientLocation: data.clientLocation || "N/A",
            clientRating: data.clientRating || 0,
            clientReviews: data.clientReviews || 0,
            clientVerified: data.clientVerified || false,
            clientPaymentVerified: data.clientPaymentVerified || false,
          });
          if (data.project.assignedTo) {
            await fetchFreelancerDetails(data.project.assignedTo);
            await fetchExistingRating();
          }
        } else {
          console.error("Failed to load project:", data);
        }
      } catch (error) {
        console.error("Failed to fetch project data", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchExistingRating = async () => {
      try {
        const res = await fetch(`/api/rating/${projectId}/client`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.rating) {
          setExistingRating(data.rating);
          setRating(data.rating.rating);
          setFeedback(data.rating.feedback || "");
        }
      } catch (err) {
        console.error("Failed to fetch existing rating", err);
      }
    };

    fetchProjectData();
  }, [projectId, token, navigate]);

  const fetchFreelancerDetails = async (freelancerId) => {
    try {
      const res = await fetch(`/api/getassigned/${freelancerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.profile && data.profile.uname) {
        setAssignedFreelancer(data.profile);
        setProfileData(data.profile);
        setShowProfileModal(true);
      } else {
        console.warn("Profile data missing or invalid:", data);
      }
    } catch (err) {
      console.error("Failed to fetch freelancer details", err);
      alert("Failed to load freelancer profile.");
    }
  };

  const confirmAssign = (proposal) => {
    setSelectedProposal(proposal);
    setShowConfirm(true);
  };

  const assignWork = async () => {
    if (!selectedProposal || project?.assignedTo) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/project/${projectId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ proposalId: selectedProposal._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setProject((prev) => ({
          ...prev,
          assignedTo: selectedProposal.freelancerId,
          status: "assigned",
        }));
        setSuccess(`✅ Work assigned to ${data.freelancerName || selectedProposal.freelancerName}`);
        setTimeout(() => setSuccess(""), 4000);
        await fetchFreelancerDetails(selectedProposal.freelancerId);
      } else {
        alert(data.message || "Assignment failed");
      }
    } catch (error) {
      console.error(error);
      alert("Assignment failed. Try again.");
    } finally {
      setAssigning(false);
      setShowConfirm(false);
    }
  };

  const unassignWork = async () => {
    if (!project?.assignedTo) return;
    if (!window.confirm("Are you sure you want to unassign this project?")) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/project/${projectId}/unassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setProject((prev) => ({ ...prev, assignedTo: null, status: "pending" }));
        setAssignedFreelancer(null);
        setRating(0);
        setFeedback("");
        setExistingRating(null);
        setSuccess("✅ Project unassigned successfully");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        alert(data.message || "Unassign failed");
      }
    } catch (err) {
      console.error(err);
      alert("Unassign failed. Try again.");
    } finally {
      setAssigning(false);
    }
  };

  const submitRating = async () => {
    if (!assignedFreelancer) return alert("No assigned freelancer to rate.");
    if (!rating) return alert("Please select a rating first!");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/rating/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          freelancerId: project.assignedTo?._id || project.assignedTo,
          ratedBy: props.currentUser?.uname, // ensure this is the logged-in user's ID
          rating,
          feedback,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("✅ Rating submitted successfully!");
        setExistingRating({ rating, feedback });
      } else {
        alert(data.message || "Rating failed");
      }
    } catch (err) {
      console.error("Rating failed", err);
      alert("Something went wrong while submitting rating.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAverageBid = (proposals) => {
    if (!proposals?.length) return 0;
    const total = proposals.reduce((sum, p) => sum + p.amount, 0);
    return Math.round(total / proposals.length);
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );

  if (!project)
    return <p className="text-center text-danger mt-4">Project not found.</p>;

  const assignedProposal = project.proposals?.find((p) => p.freelancerId === project.assignedTo);

  return (
    <Container className="project-container">
      <Row>
        <Col md={9}>
          <div className="project-details-section">
            <div className="project-header">
              <h2>{project.title}</h2>
              <Badge
                bg={project.status === "completed" ? "dark" : "success"}
                className="status-badge"
              >
                {project.status?.toUpperCase()}
              </Badge>
              <div className="bidding-info">
                <span>Bids: {project.proposals?.length || 0}</span>
                <span>Average bid: ₹{calculateAverageBid(project.proposals) || 0}</span>
              </div>
            </div>

            <Card className="project-details-card mb-4">
              <Card.Body>
                <p>{project.description}</p>
                <Row>
                  <Col md={4}>
                    <FaDollarSign /> Budget: ₹{project.budget?.min} - ₹{project.budget?.max}
                  </Col>
                  <Col md={4}>
                    <FaRegClock /> Duration: {typeof project.duration === "object" && project.duration.value ? `${project.duration.value} ${project.duration.unit || "days"}` : `${project.duration || 0} ${project.durationUnit || "days"}`}
                  </Col>
                  <Col md={4}>Skills: {project.skillsRequired?.join(", ") || "N/A"}</Col>
                </Row>
              </Card.Body>
            </Card>

            {(assignedFreelancer || project.status === "completed") && (
              <Card className="assigned-freelancer-card mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold text-success">
                        ✅ Assigned to {assignedFreelancer?.name || "Freelancer"}
                      </h6>
                      {assignedProposal?.amount && (
                        <small className="text-muted">Bid: ₹{assignedProposal.amount}</small>
                      )}
                    </div>
                    <div>
                      {project.status !== "completed" && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={unassignWork}
                          disabled={assigning}
                        >
                          <FaUndo className="me-1" /> Unassign
                        </Button>
                      )}
                    </div>
                  </div>
                  <hr />
                  <div className="mt-2">
                    <h6 className="fw-bold mb-2">
                      ⭐ {existingRating ? "Your Rating" : "Rate"}{" "}
                      {assignedFreelancer?.name || "the freelancer"}
                    </h6>
                    {existingRating && (
                      <p className="text-warning mb-2">You rated {existingRating.rating} ★</p>
                    )}
                    <div className="d-flex align-items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => setRating(star)}
                          role="button"
                          style={{
                            fontSize: "1.6rem",
                            cursor: "pointer",
                            color: star <= rating ? "#f1c40f" : "#ddd",
                            marginRight: "6px",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <Form.Control
                      as="textarea"
                      className="mb-2"
                      rows={2}
                      placeholder="Write your feedback (optional)"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={submitRating}
                        disabled={submitting}
                      >
                        {submitting ? "Submitting..." : "Submit Rating"}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setRating(existingRating?.rating || 0);
                          setFeedback(existingRating?.feedback || "");
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Proposals List */}
          <div className="proposals-section">
            <Card className="proposals-card">
              <Card.Body>
                <h4 className="mb-3 fw-bold">Proposals Received</h4>
                {project.proposals?.length === 0 ? (
                  <p className="text-muted">No proposals yet.</p>
                ) : (
                  <ul className="proposal-list">
                    {project.proposals.map((proposal, index) => {
                      const isAssigned = project.assignedTo === proposal.freelancerId;
                      return (
                        <li key={proposal._id} className="proposal-item">
                          <div className="proposal-content d-flex align-items-center">
                            <img
                              src={proposal.freelancerPhoto || "https://placehold.co/50x50"}
                              alt={proposal.freelancerName}
                              className="freelancer-photo"
                            />
                            <div className="proposal-details">
                              <h6 className="fw-bold">
                                #{index + 1} —{" "}
                                <span
                                  className="text-primary"
                                  style={{
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                  onClick={() =>
                                    navigate(`/viewprofile/${proposal.freelancerId._id}`)
                                  }
                                >
                                  {proposal.freelancerName}
                                </span>{" "}
                                {proposal.rating && (
                                  <Badge bg="warning" className="ms-2">
                                    {proposal.rating} ★
                                  </Badge>
                                )}
                              </h6>
                              <p className="text-muted small mb-2">
                                {proposal.description}
                              </p>
                              <p>
                                <strong>Bid:</strong> ₹{proposal.amount} in{" "}
                                {typeof proposal.deliveryTime === "object" && proposal.deliveryTime.value ? `${proposal.deliveryTime.value} ${proposal.deliveryTime.unit || "day"}` : `${proposal.deliveryTime || 1} ${proposal.deliveryTimeUnit || "day"}`}
                              </p>
                            </div>
                            <Button
                              variant={isAssigned ? "secondary" : "success"}
                              size="sm"
                              disabled={assigning || !!project.assignedTo}
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAssign(proposal);
                              }}
                              className="ms-3"
                            >
                              {isAssigned ? "Assigned" : "Hire"}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card.Body>
            </Card>
          </div>

          {success && <Alert variant="success" className="mt-3">{success}</Alert>}
        </Col>

        <Col md={3}>
          <Card className="client-info-card">
            <Card.Body>
              <h5>About the Client</h5>
              <p>Location: {project.clientLocation}</p>
              <p>Rating: {project.clientRating} ★ ({project.clientReviews} reviews)</p>
              <div>
                <strong>Verification:</strong>
                {project.clientVerified && <span className="text-success ms-2">✓ Identity</span>}
                {project.clientPaymentVerified && <span className="text-success ms-2">✓ Payment</span>}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="text-center mt-4">
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          ← Back to Projects
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Confirm Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to assign <strong>{selectedProposal?.freelancerName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={assignWork} disabled={assigning}>
            {assigning ? <Spinner size="sm" animation="border" /> : "Confirm Hire"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}