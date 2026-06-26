import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Tab, Tabs, Spinner, Button, Form, Card } from "react-bootstrap";

function ProjectDetails() {
  const { projectId } = useParams();
  const [key, setKey] = useState("details");
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProject();
    fetchProposals();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) setProject(data.project);
    } catch (err) {
      console.error("Error fetching project", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const res = await fetch(`/api/proposals/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) setProposals(data.proposals);
    } catch (err) {
      console.error("Error fetching proposals", err);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/proposals/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: bidAmount, description: bidDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        setProposals([...proposals, data.proposal]);
        setBidAmount("");
        setBidDescription("");
        setKey("proposals");
      }
    } catch (err) {
      console.error("Error placing bid", err);
    }
  };

  const formatBudget = (budget) => {
    if (!budget) return "N/A";
    const min =
      typeof budget.min === "object"
        ? `${budget.min.value || 0} ${budget.min.unit || ""}`
        : budget.min;
    const max =
      typeof budget.max === "object"
        ? `${budget.max.value || 0} ${budget.max.unit || ""}`
        : budget.max;
    return `${min} - ${max}`;
  };

  const formatDuration = (duration) => {
    if (!duration) return "N/A";
    if (typeof duration === "object")
      return `${duration.value || 0} ${duration.unit || "days"}`;
    return `${duration} days`;
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="text-primary mb-4">{project?.title}</h2>

      <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
        <Tab eventKey="details" title="📄 Details">
          <Card className="p-3 shadow-sm mb-3">
            <p>
              <strong>Description:</strong> {project.description}
            </p>
            <p>
              <strong>Category:</strong> {project.category}
            </p>
            <p>
              <strong>Skills Required:</strong>{" "}
              {Array.isArray(project.skillsRequired)
                ? project.skillsRequired.join(", ")
                : project.skillsRequired || "N/A"}
            </p>
            <p>
              <strong>Budget:</strong> ₹{formatBudget(project.budget)}
            </p>
            <p>
              <strong>Duration:</strong> {formatDuration(project.duration)}
            </p>
            <p>
              <strong>Type:</strong> {project.projectType}
            </p>
            <p>
              <strong>Posted By:</strong> {project.uname}
            </p>
          </Card>

          <Card className="p-3 shadow-sm">
            <h5>💼 Place Your Bid</h5>
            <Form onSubmit={handleBidSubmit}>
              <Form.Group className="mb-3" controlId="bidAmount">
                <Form.Label>Bid Amount</Form.Label>
                <Form.Control
                  type="number"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="bidDescription">
                <Form.Label>
                  Describe Your Proposal (minimum 100 characters)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="What makes you the best candidate for this project?"
                  required
                  value={bidDescription}
                  onChange={(e) => setBidDescription(e.target.value)}
                />
              </Form.Group>

              <Button variant="primary" type="submit">
                Place Bid
              </Button>
            </Form>
          </Card>
        </Tab>

        <Tab eventKey="proposals" title="📨 Proposals">
          {proposals.length === 0 ? (
            <p>No proposals yet.</p>
          ) : (
            proposals.map((prop) => (
              <Card key={prop._id} className="mb-3 p-3 shadow-sm">
                <p>
                  <strong>Freelancer:</strong> {prop.freelancerName}
                </p>
                <p>
                  <strong>Bid:</strong> ₹{prop.amount}
                </p>
                <p>
                  <strong>Proposal:</strong> {prop.description}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(prop.createdAt).toLocaleString()}
                </p>
              </Card>
            ))
          )}
        </Tab>
      </Tabs>
    </div>
  );
}

export default ProjectDetails;
