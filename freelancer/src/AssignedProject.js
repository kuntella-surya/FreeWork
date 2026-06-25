import React, { useEffect, useState } from "react";
import { Card, Spinner } from "react-bootstrap";

export default function AssignedProjects() {
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/assigned`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setAssignedProjects(data.projects);
        }
      } catch (error) {
        console.error("Failed to fetch assigned projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssigned();
  }, [token]);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <div className="container mt-4">
      <h3 className="mb-3 text-success">🧑‍💻 Your Assigned Projects</h3>
      {assignedProjects.length === 0 ? (
        <p>No projects assigned yet.</p>
      ) : (
        assignedProjects.map((project) => (
          <Card key={project._id} className="mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>{project.title}</Card.Title>
              <Card.Text>{project.description}</Card.Text>
              <p><strong>Budget:</strong> ${project.budget.min} - ${project.budget.max}</p>
              <p><strong>Duration:</strong> {project.duration} days</p>
              <p><strong>Status:</strong> {project.status}</p>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
}
