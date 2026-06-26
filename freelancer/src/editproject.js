import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Button, Spinner, Alert, Badge } from "react-bootstrap";


export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    projectType: "fixed",
    skillsRequired: [],
    budgetMin: 0,
    budgetMax: 0,
    duration: 0,
    locationAddress: "",
  });

  const categories = [
    "Plumbing","Electrical","Carpentry","Painting","Home Cleaning",
    "Appliance Repair","AC Service & Repair","Mobile Repair","Bike Repair",
    "Car Repair","Photography","Event Management","Gardening","Pest Control",
    "Tuition / Coaching","Tailoring","Laundry","Beauty & Salon","Babysitting",
    "Pet Care","Delivery & Pickup","Construction","Others"
  ];

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/project/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setProject(data.project);
          setFormData({
            title: data.project.title,
            description: data.project.description,
            category: data.project.category,
            projectType: data.project.projectType,
            skillsRequired: data.project.skillsRequired || [],
            budgetMin: data.project.budget.min,
            budgetMax: data.project.budget.max,
            duration: data.project.duration,
            locationAddress: data.project.location?.address || "",
          });
        } else {
          setError(data.message || "Failed to fetch project");
        }
      } catch (err) {
        setError("Server error while fetching project");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, token]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (e) => {
    const value = e.target.value.split(",").map(s => s.trim());
    setFormData(prev => ({ ...prev, skillsRequired: value }));
  };

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/project/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          projectType: formData.projectType,
          skillsRequired: formData.skillsRequired,
          budget: { min: formData.budgetMin, max: formData.budgetMax },
          duration: formData.duration,
          location: { address: formData.locationAddress },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Project updated successfully!");
        setTimeout(() => navigate("/myprojects"), 1500);
      } else {
        setError(data.message || "Failed to update project");
      }
    } catch (err) {
      console.error(err);
      setError("Server error while updating project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner animation="border" variant="primary" className="d-block mx-auto mt-5" />;

  return (
    <div className="container py-5 edit-project-page">
      <h2 className="text-center mb-4 gradient-text">✏️ Edit Project</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
        <style jsx>{`.edit-project-page {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.edit-project-page .form-label {
  font-weight: 500;
}

.edit-project-page .form-control {
  border-radius: 8px;
}

.edit-project-page .gradient-text {
  background: linear-gradient(90deg,#007bff,#28a745);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.edit-project-page button {
  min-width: 120px;
}
`}</style>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Project Title</Form.Label>
          <Form.Control
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Project Type</Form.Label>
          <Form.Select
            name="projectType"
            value={formData.projectType}
            onChange={handleChange}
          >
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Skills Required <small>(comma separated)</small></Form.Label>
          <Form.Control
            type="text"
            value={formData.skillsRequired.join(", ")}
            onChange={handleSkillsChange}
          />
        </Form.Group>

        <div className="row g-3">
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>Budget Min (₹)</Form.Label>
              <Form.Control
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
              />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>Budget Max (₹)</Form.Label>
              <Form.Control
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
              />
            </Form.Group>
          </div>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Duration (days)</Form.Label>
          <Form.Control
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Location / Address</Form.Label>
          <Form.Control
            type="text"
            name="locationAddress"
            value={formData.locationAddress}
            onChange={handleChange}
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4">
          <Button
            variant="success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/myprojects")}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}
