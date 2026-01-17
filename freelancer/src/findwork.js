import { useEffect, useState } from "react";
import { Spinner, Card, Button, Form, Alert, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsChatDots } from "react-icons/bs";
import "./App.css";

function FindWork() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedListingType, setSelectedListingType] = useState([]);
  const [locationRange, setLocationRange] = useState(10);
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [capacity, setCapacity] = useState("58.5 GB");
  const [fileSystem, setFileSystem] = useState("exFAT");
  const [allocationSize, setAllocationSize] = useState("128 kilobytes");
  const [volumeLabel, setVolumeLabel] = useState("");
  const [quickFormat, setQuickFormat] = useState(true);
  const [projectType, setProjectType] = useState([]); // New: Array for selected project types
  const [fixedPriceMin, setFixedPriceMin] = useState(0); // New: Minimum fixed price
  const [fixedPriceMax, setFixedPriceMax] = useState(1500); // New: Maximum fixed price
  const [hourlyRateMin, setHourlyRateMin] = useState(0); // New: Minimum hourly rate
  const [hourlyRateMax, setHourlyRateMax] = useState(80); // New: Maximum hourly rate
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Location access denied:", err);
          setError("Unable to access location. Please allow location access or try again.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [
    sortBy,
    selectedCategory,
    selectedListingType,
    locationRange,
    userLocation,
    projectType,
    fixedPriceMin,
    fixedPriceMax,
    hourlyRateMin,
    hourlyRateMax,
    token,
  ]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = new URLSearchParams();
      if (userLocation.latitude && userLocation.longitude) {
        query.append("latitude", userLocation.latitude);
        query.append("longitude", userLocation.longitude);
        query.append("range", locationRange);
      }
      if (selectedCategory) query.append("category", selectedCategory);
      if (selectedListingType.length) query.append("listingType", selectedListingType.join(","));
      if (sortBy) query.append("sortBy", sortBy);
      if (projectType.length) query.append("projectType", projectType.join(","));
      if (fixedPriceMin > 0) query.append("fixedPriceMin", fixedPriceMin);
      if (fixedPriceMax < 1500) query.append("fixedPriceMax", fixedPriceMax);
      if (hourlyRateMin > 0) query.append("hourlyRateMin", hourlyRateMin);
      if (hourlyRateMax < 80) query.append("hourlyRateMax", hourlyRateMax);

      const res = await fetch(`${API_URL}/api/projects/findwork?${query.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects);
      } else {
        setError(data.message || "Failed to fetch projects.");
      }
    } catch (err) {
      setError("An error occurred while fetching projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleListingTypeChange = (e) => {
    const type = e.target.value;
    setSelectedListingType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleProjectTypeChange = (e) => {
    const type = e.target.value;
    setProjectType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearProjectType = () => setProjectType([]);
  const clearFixedPrice = () => {
    setFixedPriceMin(0);
    setFixedPriceMax(1500);
  };
  const clearHourlyRate = () => {
    setHourlyRateMin(0);
    setHourlyRateMax(80);
  };

  const handleFormatUSB = () => {
    setError(
      `Formatting USB drive (${capacity}) with ${fileSystem}, allocation size ${allocationSize}, and volume label "${volumeLabel}" ${
        quickFormat ? "using Quick Format" : ""
      }. This is a simulated action.`
    );
    setShowFormatModal(false);
  };

  return (
    <div className="container mt-4 d-flex flex-column flex-md-row">
      <div className="col-12 col-md-3 pe-md-4 mb-3 mb-md-0">
        <h5>Filters</h5>
        <div className="mb-3">
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Select project category"
          >
            <option value="">Select Category</option>
            <option>Plumbing</option>
            <option>Electrical</option>
            {/* ... other options ... */}
            <option>Others</option>
          </Form.Select>
        </div>

        <div className="mb-3">
          <h6>Listing type</h6>
          {["Featured", "Sealed", "NDA", "Urgent", "Recruiter", "IP Agreement"].map((type) => (
            <Form.Check
              key={type}
              type="checkbox"
              label={type}
              value={type}
              onChange={handleListingTypeChange}
              aria-label={`Filter by ${type} listing`}
            />
          ))}
        </div>

        <div className="mb-3">
          <h6>Range (km): {locationRange} km</h6>
          <Form.Range
            min={0}
            max={100000}
            value={locationRange}
            onChange={(e) => setLocationRange(Number(e.target.value))}
            className="custom-range"
            aria-label="Location range in kilometers"
          />
        </div>

        <div className="mb-3">
          <h6>Project type <a href="#" onClick={clearProjectType} style={{ float: "right", color: "#007bff" }}>Clear</a></h6>
          <Form.Check
            type="checkbox"
            label="Hourly Rate"
            value="Hourly Rate"
            checked={projectType.includes("Hourly Rate")}
            onChange={handleProjectTypeChange}
          />
          <Form.Check
            type="checkbox"
            label="Fixed Price"
            value="Fixed Price"
            checked={projectType.includes("Fixed Price")}
            onChange={handleProjectTypeChange}
          />
        </div>

        <div className="mb-3">
          <h6>Fixed price <a href="#" onClick={clearFixedPrice} style={{ float: "right", color: "#007bff" }}>Clear</a></h6>
          <Form.Group className="mb-2">
            <Form.Label>min</Form.Label>
            <Form.Control
              type="number"
              value={fixedPriceMin}
              onChange={(e) => setFixedPriceMin(Math.max(0, Number(e.target.value)))}
              min="0"
              placeholder="$0"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>max</Form.Label>
            <Form.Control
              type="number"
              value={fixedPriceMax}
              onChange={(e) => setFixedPriceMax(Math.min(1500, Number(e.target.value)))}
              max="1500"
              placeholder="$1500+"
            />
          </Form.Group>
        </div>

        <div className="mb-3">
          <h6>Hourly rate <a href="#" onClick={clearHourlyRate} style={{ float: "right", color: "#007bff" }}>Clear</a></h6>
          <Form.Group className="mb-2">
            <Form.Label>min</Form.Label>
            <Form.Control
              type="number"
              value={hourlyRateMin}
              onChange={(e) => setHourlyRateMin(Math.max(0, Number(e.target.value)))}
              min="0"
              placeholder="$0"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>max</Form.Label>
            <Form.Control
              type="number"
              value={hourlyRateMax}
              onChange={(e) => setHourlyRateMax(Math.min(80, Number(e.target.value)))}
              max="80"
              placeholder="$80+"
            />
          </Form.Group>
        </div>

        <style jsx>{`
          .custom-range {
            --bs-range-color: #0d6efd;
            --bs-range-thumb-color: #0d6efd;
          }
          .custom-range::-webkit-slider-thumb {
            background-color: #0d6efd;
            border-radius: 50%;
          }
          .custom-range::-webkit-slider-runnable-track {
            background-color: #cce5ff;
            height: 6px;
            border-radius: 3px;
          }
          .custom-range::-moz-range-thumb {
            background-color: #0d6efd;
            border-radius: 50%;
          }
          .custom-range::-moz-range-track {
            background-color: #cce5ff;
            height: 6px;
            border-radius: 3px;
          }
        `}</style>
      </div>

      <div className="col-12 col-md-9">
        <h2 className="text-primary mb-4">🔍 Find Work</h2>
        <Form.Select
          className="mb-4 w-25"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort projects"
        >
          <option value="date">Sort by: Latest</option>
          <option value="budget">Sort by: Budget</option>
          <option value="proximity">Sort by: Proximity</option>
          <option value="location">Sort by: Location</option>
        </Form.Select>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-muted">
            No projects found. Try adjusting your filters.
          </div>
        ) : (
          <div className="row g-4">
            {projects.map((project) => (
              <div className="col-12" key={project._id}>
                <Card className="shadow-sm border-0 mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between">
                      <div>
                        <Card.Title className="text-primary fw-bold">{project.title}</Card.Title>
                        <Card.Text className="text-muted small mb-2">
                          {project.bids} bids &nbsp; {project.averageBid}
                        </Card.Text>
                        <Card.Text className="small">{project.description}</Card.Text>
                        <div className="mb-2">
                          <strong>Category:</strong> {project.category}
                        </div>
                        {project.location?.coordinates?.length === 2 &&
                          userLocation.latitude &&
                          userLocation.longitude && (
                            <div className="mb-2">
                              <strong>Distance:</strong>{" "}
                              {calculateDistance(
                                userLocation.latitude,
                                userLocation.longitude,
                                project.location.coordinates[1],
                                project.location.coordinates[0]
                              ).toFixed(2)} km
                            </div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="text-muted small">{new Date(project.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-light border-top">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/project/${project._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="ms-2"
                      onClick={() =>
                        navigate(`/chat/${project.clientId}`, {
                          state: { otherUserName: project.uname, projectId: project._id },
                        })
                      }
                      title="Start Chat"
                    >
                      <BsChatDots />
                    </Button>
                  </Card.Footer>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FindWork;