import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import './searchbar.css'; // Add custom CSS

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  // Debounced fetch for live suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/recommend-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, skills: [] }),
        });
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Log suggestions for debugging
  useEffect(() => {
    console.log("Suggestions:", suggestions);
  }, [suggestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestionClick = (jobId, query) => {
    navigate(`/related-jobs/${jobId}?query=${encodeURIComponent(query)}`);
  };
  console.log("Current query:", query); 

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs (e.g., maths teacher, bike repair)..."
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((job) => (
            <div
              key={job.job_id}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(job.job_id, query)}
            >
              <span className="suggestion-title">{job.title}</span>
              <span className="suggestion-desc">{job.description.substring(0, 50)}...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;