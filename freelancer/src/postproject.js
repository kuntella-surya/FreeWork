import { useState, useEffect, useRef } from "react";
import { Spinner, Alert, Modal, Button } from "react-bootstrap";
import "./App.css";
import axios from "axios";

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
    suggestedCategory: "",
    suggestedSkills: [],
    categorizedSkills: {},
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem("token");
  const manualLocationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Load Google Maps script and initialize autocomplete + current location
  useEffect(() => {
    let script = null;

    const loadScript = () => {
      if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
        initAutocomplete();
        return;
      }

      script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyBD2aTTLV8guzp0Z4DAbQXmeTSEnIciYJw&libraries=places";
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      script.onerror = () => setError("Failed to load Google Maps. Please check your connection.");
      document.body.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!window.google || !manualLocationInputRef.current) return;

      // Clear previous listener if exists
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

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
            manualLocation: place.formatted_address || place.name,
          }));
          setError("");
        } else {
          setError("Selected place has no location data.");
        }
      });
    };

    loadScript();

    // Auto-get current location on mount if "current" is selected
    const getCurrentLocation = () => {
      if (navigator.geolocation && form.locationType === "current") {
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
            console.warn("Geolocation error:", err);
            setError("Location access denied. Switching to manual input.");
            setForm((prev) => ({
              ...prev,
              locationType: "manual",
              latitude: null,
              longitude: null,
            }));
          }
        );
      }
    };

    getCurrentLocation();

    // Cleanup script on unmount
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [form.locationType]); // Re-run when locationType changes

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

    if (value === "current" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setError("");
        },
        () => {
          setError("Location access denied. Using manual location.");
          setForm((prev) => ({ ...prev, locationType: "manual" }));
        }
      );
    }
  };

  const extractCategoryAndSkills = async () => {
    try {
      const [descRes, skillsRes] = await Promise.all([
        axios.post("http://localhost:5000/extract-skills", { text: form.description }),
        axios.post("http://localhost:5000/extract-skills", { text: form.skillsRequired || form.description }),
      ]);

      const suggestedCategory = Object.keys(descRes.data.categorized_skills)[0] || "Others";
      const suggestedSkills = descRes.data.categorized_skills[suggestedCategory] || [];
      const categorizedSkills = skillsRes.data.categorized_skills || {};

      return { suggestedCategory, suggestedSkills, categorizedSkills };
    } catch (err) {
      console.error("Skill extraction failed:", err);
      setError("AI suggestion failed. Proceeding manually.");
      return { suggestedCategory: "Others", suggestedSkills: [], categorizedSkills: {} };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (form.locationType === "current" && (!form.latitude || !form.longitude)) {
      setError("Location not available. Please allow access or use manual location.");
      setLoading(false);
      return;
    }

    if (!form.durationValue || !form.durationUnit) {
      setError("Please specify project duration.");
      setLoading(false);
      return;
    }

    const { suggestedCategory, suggestedSkills, categorizedSkills } = await extractCategoryAndSkills();

    const validCategories = [
      "Plumbing", "Electrical", "Carpentry", "Painting", "Home Cleaning", "Appliance Repair",
      "AC Service & Repair", "Mobile Repair", "Bike Repair", "Car Repair", "Photography",
      "Event Management", "Gardening", "Pest Control", "Tuition / Coaching", "Tailoring",
      "Laundry", "Beauty & Salon", "Babysitting", "Pet Care", "Delivery & Pickup",
      "Construction", "Others"
    ];

    let finalCategory = form.category;
    if (validCategories.includes(suggestedCategory) && form.category !== suggestedCategory) {
      finalCategory = suggestedCategory;
      setError(`Category auto-updated to "${suggestedCategory}" based on your description.`);
    }

    setForm((prev) => ({
      ...prev,
      suggestedCategory,
      suggestedSkills,
      categorizedSkills,
      category: finalCategory,
    }));

    setShowModal(true);
    setLoading(false);
  };

  const handleModalConfirm = async (confirm) => {
    setShowModal(false);
    if (!confirm) return;

    setLoading(true);
    try {
      const postData = {
        title: form.title,
        description: form.description,
        skillsRequired: form.suggestedSkills.length > 0 ? form.suggestedSkills.join(", ") : form.skillsRequired,
        minBudget: Number(form.minBudget) || 0,
        maxBudget: Number(form.maxBudget) || 0,
        durationValue: form.durationValue,
        durationUnit: form.durationUnit,
        category: form.category,
        projectType: form.projectType,
        latitude: form.latitude,
        longitude: form.longitude,
        manualLocation: form.locationType === "manual" ? form.manualLocation : "",
        categorizedSkills: form.categorizedSkills,
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/project/postp`, {
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
          title: "", description: "", skillsRequired: "", minBudget: "", maxBudget: "",
          durationValue: "", durationUnit: "", category: "", projectType: "fixed",
          latitude: null, longitude: null, locationType: "current", manualLocation: "",
          suggestedCategory: "", suggestedSkills: [], categorizedSkills: {}
        });
      } else {
        setError(data.message || "Failed to post project.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 post-project-container">
      <div className="card shadow p-4">
        <h2 className="mb-4 text-primary">Post a New Project</h2>

        {success && <Alert variant="success">Project posted successfully!</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          {/* Project Title */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Title</label>
            <input name="title" value={form.title} onChange={handleChange} required className="form-control" />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required className="form-control" rows={4} />
          </div>

          {/* Skills Required */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Required Skills</label>
            <input name="skillsRequired" value={form.skillsRequired} onChange={handleChange} className="form-control" />
            <small className="text-muted">Separate skills with commas (optional if AI suggests)</small>
          </div>

          {/* Budget */}
          <div className="row mb-3">
            <div className="col">
              <label className="form-label fw-semibold">Min Budget (₹)</label>
              <input name="minBudget" type="number" value={form.minBudget} onChange={handleChange} className="form-control" />
            </div>
            <div className="col">
              <label className="form-label fw-semibold">Max Budget (₹)</label>
              <input name="maxBudget" type="number" value={form.maxBudget} onChange={handleChange} className="form-control" />
            </div>
          </div>

          {/* Duration */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Duration</label>
            <div className="input-group">
              <input name="durationValue" type="number" min="1" value={form.durationValue} onChange={handleChange} required className="form-control" placeholder="e.g., 3" />
              <select name="durationUnit" value={form.durationUnit} onChange={handleChange} required className="form-select">
                <option value="">Unit</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
                <option value="full-time">Full Time</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Project Category</label>
            <select name="category" value={form.category} onChange={handleChange} required className="form-select">
              <option value="">Select Category</option>
              {["Plumbing","Electrical","Carpentry","Painting","Home Cleaning","Appliance Repair",
                "AC Service & Repair","Mobile Repair","Bike Repair","Car Repair","Photography",
                "Event Management","Gardening","Pest Control","Tuition / Coaching","Tailoring",
                "Laundry","Beauty & Salon","Babysitting","Pet Care","Delivery & Pickup",
                "Construction","Others"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {form.suggestedCategory && form.category !== form.suggestedCategory && (
              <small className="text-warning d-block mt-1">
                Suggested: {form.suggestedCategory}
              </small>
            )}
          </div>

          {/* Project Type */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Project Type</label>
            <div className="form-check">
              <input type="radio" name="projectType" value="fixed" checked={form.projectType === "fixed"} onChange={handleChange} className="form-check-input" />
              <label className="form-check-label">Fixed Price</label>
            </div>
            <div className="form-check">
              <input type="radio" name="projectType" value="hourly" checked={form.projectType === "hourly"} onChange={handleChange} className="form-check-input" />
              <label className="form-check-label">Hourly</label>
            </div>
          </div>

          {/* Location */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Location</label>
            <div className="mb-2">
              <div className="form-check">
                <input type="radio" name="locationType" value="current" checked={form.locationType === "current"} onChange={handleLocationTypeChange} className="form-check-input" />
                <label className="form-check-label">Use My Current Location</label>
              </div>
              <div className="form-check">
                <input type="radio" name="locationType" value="manual" checked={form.locationType === "manual"} onChange={handleLocationTypeChange} className="form-check-input" />
                <label className="form-check-label">Enter Location Manually</label>
              </div>
            </div>

            {form.locationType === "manual" && (
              <input
                ref={manualLocationInputRef}
                name="manualLocation"
                value={form.manualLocation}
                onChange={handleChange}
                className="form-control"
                placeholder="Search for a location..."
                autoComplete="off"
              />
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || (form.locationType === "current" && !form.latitude)}
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" /> Analyzing & Posting...
              </>
            ) : (
              "Post Project"
            )}
          </button>
        </form>

        {/* Confirmation Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Project Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Please review before posting:</p>
            <ul className="list-unstyled">
              <li><strong>Title:</strong> {form.title}</li>
              <li><strong>Description:</strong> {form.description}</li>
              <li><strong>Skills (AI Suggested):</strong> {form.suggestedSkills.join(", ") || "None"}</li>
              <li><strong>Manual Skills:</strong> {form.skillsRequired || "—"}</li>
              <li><strong>Budget:</strong> ₹{form.minBudget} - ₹{form.maxBudget}</li>
              <li><strong>Duration:</strong> {form.durationValue} {form.durationUnit}</li>
              <li><strong>Category:</strong> {form.category} {form.suggestedCategory !== form.category && `(Suggested: ${form.suggestedCategory})`}</li>
              <li><strong>Type:</strong> {form.projectType === "fixed" ? "Fixed Price" : "Hourly"}</li>
              <li><strong>Location:</strong> {form.locationType === "manual" ? form.manualLocation : "Your Current Location"}</li>
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Edit</Button>
            <Button variant="primary" onClick={() => handleModalConfirm(true)}>Confirm & Post</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default PostProject;