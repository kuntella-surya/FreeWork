import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

function RelatedJobs() {
  const { jobId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [relatedJobs, setRelatedJobs] = useState([]);
  const queryParams = new URLSearchParams(search);
  const query = queryParams.get("query");

  useEffect(() => {
    async function fetchRelatedJobs() {
  try {
    console.log("Fetching related jobs for jobId:", jobId, "query:", query);
    const res = await fetch(`${process.env.REACT_APP_API_URL}/ai/related-jobs/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, skills: [] }),
    });
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
    setRelatedJobs(data.suggestions || []);
  } catch (err) {
    console.error("Error fetching related jobs:", err);
  }
}
  }, [jobId, query]);

  return (
    <div className="container mt-4">
      <h2>Freelancer Jobs for "{query}"</h2>
      {relatedJobs.length > 0 ? (
        <div className="row">
          {relatedJobs.map((job) => (
            <div key={job.job_id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h5 className="card-title">{job.title}</h5>
                  <p className="card-text text-muted">{job.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-primary">
                      {job.skillsRequired?.length > 0 ? job.skillsRequired.join(", ") : "No skills"}
                    </span>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(`/project/${job.job_id}`)}
                    >
                      Select Job
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No freelancer jobs found for "{query}".</p>
      )}
    </div>
  );
}

export default RelatedJobs;