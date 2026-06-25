import { useState, useEffect, useRef } from "react";
import { Spinner, Alert, Modal, Button } from "react-bootstrap";
import "./App.css";
import axios from "axios"; // Add axios for API calls

function PostProject() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    skillsRequired: "",
    minBudget: "",
    maxBudget: "",
    durationValue: "",
    durationUnit: "",
    category: "",
    projectType: "fixed",
    latitude: null,
    longitude: null,
    locationType: "current",
    manualLocation: "",
    suggestedCategory: "", // To store suggested category from API
    suggestedSkills: [], // To store suggested skills from description
    categorizedSkills: {}, // To store categorized skills
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false); // Modal state for confirmation
  const token = localStorage.getItem("token");
  const manualLocationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      initAutocomplete();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDZj8y6au_MNneK-eFyvFbroyqvPxFxxQs&libraries=places";
    script.async = true;
    script.defer = true;

    script.onload = () => initAutocomplete();
    script.onerror = () => setError("Google Maps API failed to load.");

    document.body.appendChild(script);
    return () => {
      if (script) document.body.removeChild(script);
    };
  }, []);

  const initAutocomplete = () => {
    if (!window.google || !manualLocationInputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      manualLocationInputRef.current,
      { types: ["geocode"] }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          manualLocation: place.formatted_address,
        }));
      } else {
        setError("No location data available for selected place.");
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationTypeChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      locationType: value,
      manualLocation: value === "manual" ? prev.manualLocation : "",
      latitude: value === "current" ? null : prev.latitude,
      longitude: value === "current" ? null : prev.longitude,
    }));

    if (value === "current") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setForm((prev) => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }));
            setError("");
          },
          (err) => {
            console.warn("Location access denied", err);
            setError("Location access denied. Use manual location.");
            setForm((prev) => ({
              ...prev,
              locationType: "manual",
              latitude: null,
              longitude: null,
            }));
          }
        );
      } else {
        setError("Geolocation not supported. Use manual location.");
        setForm((prev) => ({
          ...prev,
          locationType: "manual",
        }));
      }
    }
  };

  // Function to extract category and suggest skills from description
  const extractCategoryAndSkills = async () => {
    try {
      const descriptionResponse = await axios.post("http://localhost:5000/extract-skills", {
        text: form.description,
      });
      const skillsResponse = await axios.post("http://localhost:5000/extract-skills", {
        text: form.skillsRequired || form.description, // Fallback to description if skillsRequired is empty
      });

      const descData = descriptionResponse.data;
      const skillsData = skillsResponse.data;

      // Suggest category based on description
      const suggestedCategory = Object.keys(descData.categorized_skills)[0] || "Others";
      // Suggest skills from description, falling back to skillsRequired if available
      const suggestedSkills = descData.categorized_skills[suggestedCategory] || [];
      const categorizedSkills = skillsData.categorized_skills || {};

      return { suggestedCategory, suggestedSkills, categorizedSkills };
    } catch (err) {
      setError("Failed to categorize description or suggest skills. Proceed manually.");
      console.error(err);
      return { suggestedCategory: "Others", suggestedSkills: [], categorizedSkills: {} };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (form.locationType === "current" && (!form.latitude || !form.longitude)) {
      setError("Please allow location access or use manual location.");
      setLoading(false);
      return;
    }
    if (!form.durationValue || !form.durationUnit) {
      setError("Please specify project duration and time unit.");
      setLoading(false);
      return;
    }

    // Extract category and skills on submit
    const { suggestedCategory, suggestedSkills, categorizedSkills } = await extractCategoryAndSkills();
    // Valid categories from the schema
    const validCategories = [
      "Plumbing",
      "Electrical",
      "Carpentry",
      "Painting",
      "Home Cleaning",
      "Appliance Repair",
      "AC Service & Repair",
      "Mobile Repair",
      "Bike Repair",
      "Car Repair",
      "Photography",
      "Event Management",
      "Gardening",
      "Pest Control",
      "Tuition / Coaching",
      "Tailoring",
      "Laundry",
      "Beauty & Salon",
      "Babysitting",
      "Pet Care",
      "Delivery & Pickup",
      "Construction",
      "Others",
    ];

    // Update category if selected category doesn't match suggested and suggested is valid
    let updatedCategory = form.category;
    if (form.category && suggestedCategory && form.category !== suggestedCategory && validCategories.includes(suggestedCategory)) {
      updatedCategory = suggestedCategory;
      setError(`Category updated to "${suggestedCategory}" based on description analysis.`);
    }

    setForm((prev) => ({
      ...prev,
      suggestedCategory,
      suggestedSkills,
      categorizedSkills,
      category: updatedCategory, // Update category state
    }));

    // Show confirmation modal with recommended category and skills
    setShowModal(true);
    setLoading(false);
  };

  const handleModalConfirm = async (confirm) => {
    setShowModal(false);
    if (confirm) {
      setLoading(true);
      try {
        const postData = {
          title: form.title,
          description: form.description,
          skillsRequired: form.suggestedSkills.length > 0 ? form.suggestedSkills.join(", ") : form.skillsRequired,
          minBudget: Number(form.minBudget),
          maxBudget: Number(form.maxBudget),
          durationValue: form.durationValue,
          durationUnit: form.durationUnit,
          category: form.category, // Use updated category
          projectType: form.projectType,
          latitude: form.latitude,
          longitude: form.longitude,
          manualLocation: form.locationType === "manual" ? form.manualLocation : "",
          categorizedSkills: form.categorizedSkills,
        };
        console.log("Sending to server:", postData); // Log the data being sent

        const res = await fetch("${process.env.REACT_APP_API_URL}/api/project/postp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(postData),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess(true);
          setForm({
            title: "",
            description: "",
            skillsRequired: "",
            minBudget: "",
            maxBudget: "",
            durationValue: "",
            durationUnit: "",
            category: "",
            projectType: "fixed",
            latitude: null,
            longitude: null,
            locationType: "current",
            manualLocation: "",
            suggestedCategory: "",
            suggestedSkills: [],
            categorizedSkills: {},
          });
        } else {
          setError(data.message || "Failed to post project.");
        }
      } catch (err) {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mt-4 post-project-container">
      <div className="card shadow p-4">
        <h2 className="mb-4 text-primary">📢 Post a New Project</h2>

        {success && <Alert variant="success">✅ Project posted successfully!</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* Project Title */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Title</label>
            <input
              name="title"
              value={form.title}
              required
              className="form-control"
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Description</label>
            <textarea
              name="description"
              value={form.description}
              required
              className="form-control"
              rows={4}
              onChange={handleChange}
            />
          </div>

          {/* Skills */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Required Skills</label>
            <input
              name="skillsRequired"
              value={form.skillsRequired}
              required
              className="form-control"
              onChange={handleChange}
            />
            <small className="text-muted">Separate skills with commas</small>
          </div>

          {/* Budget */}
          <div className="row mb-3">
            <div className="col">
              <label className="form-label fw-semibold">Min Budget (₹)</label>
              <input
                name="minBudget"
                type="number"
                min={0}
                value={form.minBudget}
                className="form-control"
                onChange={handleChange}
              />
            </div>
            <div className="col">
              <label className="form-label fw-semibold">Max Budget (₹)</label>
              <input
                name="maxBudget"
                type="number"
                min={form.minBudget}
                value={form.maxBudget}
                className="form-control"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Duration */}
          <style jsx>{`.input-group .form-control,
.input-group .form-select {
  border-radius: 10px !important;
}

.form-label {
  font-weight: 600;
}

.text-muted {
  font-size: 0.85rem;
}
`}</style>
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Duration</label>
            <div className="input-group">
              <input
                name="durationValue"
                type="number"
                min={1}
                value={form.durationValue}
                required
                className="form-control"
                placeholder="Enter duration"
                onChange={handleChange}
              />
              <select
                name="durationUnit"
                className="form-select"
                value={form.durationUnit}
                onChange={handleChange}
                required
              >
                <option value="">Select time frame</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
                <option value="full-time">Full Time</option>
              </select>
            </div>
            <small className="text-muted">
              Example: 3 Days, 2 Weeks, or Full Time engagement
            </small>
          </div>

          {/* Category */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Category</label>
            <select
              name="category"
              className="form-select"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Painting">Painting</option>
              <option value="Home Cleaning">Home Cleaning</option>
              <option value="Appliance Repair">Appliance Repair</option>
              <option value="AC Service & Repair">AC Service & Repair</option>
              <option value="Mobile Repair">Mobile Repair</option>
              <option value="Bike Repair">Bike Repair</option>
              <option value="Car Repair">Car Repair</option>
              <option value="Photography">Photography</option>
              <option value="Event Management">Event Management</option>
              <option value="Gardening">Gardening</option>
              <option value="Pest Control">Pest Control</option>
              <option value="Tuition / Coaching">Tuition / Coaching</option>
              <option value="Tailoring">Tailoring</option>
              <option value="Laundry">Laundry</option>
              <option value="Beauty & Salon">Beauty & Salon</option>
              <option value="Babysitting">Babysitting</option>
              <option value="Pet Care">Pet Care</option>
              <option value="Delivery & Pickup">Delivery & Pickup</option>
              <option value="Construction">Construction</option>
              <option value="Others">Others</option>
            </select>
            {form.suggestedCategory && form.category !== form.suggestedCategory && (
              <small className="text-warning mt-1 d-block">
                Suggested category: {form.suggestedCategory}
              </small>
            )}
          </div>

          {/* Project Type */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Project Type</label>
            <div className="form-check">
              <input
                type="radio"
                name="projectType"
                value="fixed"
                className="form-check-input"
                checked={form.projectType === "fixed"}
                onChange={handleChange}
              />
              <label className="form-check-label">Fixed Price</label>
            </div>
            <div className="form-check">
              <input
                type="radio"
                name="projectType"
                value="hourly"
                className="form-check-input"
                checked={form.projectType === "hourly"}
                onChange={handleChange}
              />
              <label className="form-check-label">Hourly</label>
            </div>
          </div>

          {/* Location */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Location</label>
            <div className="mb-2">
              <div className="form-check">
                <input
                  type="radio"
                  name="locationType"
                  value="current"
                  className="form-check-input"
                  checked={form.locationType === "current"}
                  onChange={handleLocationTypeChange}
                />
                <label className="form-check-label">Current Location</label>
              </div>
              <div className="form-check">
                <input
                  type="radio"
                  name="locationType"
                  value="manual"
                  className="form-check-input"
                  checked={form.locationType === "manual"}
                  onChange={handleLocationTypeChange}
                />
                <label className="form-check-label">Manual Location</label>
              </div>
            </div>

            {form.locationType === "manual" && (
              <input
                ref={manualLocationInputRef}
                name="manualLocation"
                value={form.manualLocation}
                className="form-control"
                placeholder="Type to search location..."
                onChange={handleChange}
              />
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={
              loading ||
              (form.locationType === "current" &&
                (!form.latitude || !form.longitude))
            }
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" /> Posting...
              </>
            ) : (
              "🚀 Post Project"
            )}
          </button>
        </form>

        {/* Confirmation Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Project Posting</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Check details of project before posting.</p>
            <ul>
              <li><strong>Title:</strong> {form.title}</li>
              <li><strong>Description:</strong> {form.description}</li>
              <li><strong>Suggested Skills:</strong> {form.suggestedSkills.join(", ") || "No skills suggested"}</li>
              <li><strong>Manual Skills:</strong> {form.skillsRequired}</li>
              <li><strong>Budget:</strong> ₹{form.minBudget} - ₹{form.maxBudget}</li>
              <li><strong>Duration:</strong> {form.durationValue} {form.durationUnit}</li>
              <li><strong>Recommended Category:</strong> {form.suggestedCategory}</li>
              <li><strong>Selected Category:</strong> {form.category}</li>
              <li><strong>Type:</strong> {form.projectType}</li>
              <li><strong>Location:</strong> {form.locationType === "manual" ? form.manualLocation : "Current Location"}</li>
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handleModalConfirm(true)}>
              Post
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default PostProject;