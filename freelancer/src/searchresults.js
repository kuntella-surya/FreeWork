import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

export default function SearchResults() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q") || ""; // get ?q=searchTerm
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!query) return;

    async function fetchJobs() {
      try {
        const res = await fetch("${process.env.REACT_APP_API_URL}/ai/recommend-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, skills: [] }),
        });
        const data = await res.json();
        setJobs(data.suggestions || []);
      } catch (err) {
        console.error(err);
      }
    }

    fetchJobs();
  }, [query]);

  return (
    <div className="container mt-3">
      <h3>Search results for "{query}"</h3>
      {jobs.length > 0 ? (
        <div className="row">
          {jobs.map((job) => (
            <div key={job.job_id} className="col-md-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5>{job.title}</h5>
                  <p>{job.description}</p>
                  <Link to={`/project/${job.job_id}`} className="btn btn-primary btn-sm">
                    View Project
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No jobs found.</p>
      )}
    </div>
  );
}