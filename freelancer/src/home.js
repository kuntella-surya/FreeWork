import React from "react";
import "./Home.css";

import {
  FaCode,
  FaPaintBrush,
  FaBullhorn,
  FaVideo,
  FaArrowRight,
  FaStar,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";

const Home = () => {
  return (
    <div className="home">

      {/* HERO SECTION */}
      <section className="hero">

        <div className="hero-left">
          <span className="hero-badge">🔥 #1 Freelance Marketplace</span>

          <h1>
            Hire Expert Freelancers <br />
            For Any Job, Online
          </h1>

          <p>
            Connect with talented developers, designers, writers,
            and marketers from around the world.
          </p>

          <div className="hero-search">
            <input
              type="text"
              placeholder="Search for any service..."
            />
            <button>
              Search
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <h3>10K+</h3>
              <span>Freelancers</span>
            </div>

            <div>
              <h3>5K+</h3>
              <span>Projects</span>
            </div>

            <div>
              <h3>99%</h3>
              <span>Success Rate</span>
            </div>
          </div>
        </div>

        <div className="hero-right">

          <div className="floating-card card1">
            <FaStar />
            <div>
              <h4>Top Rated</h4>
              <p>UI/UX Designers</p>
            </div>
          </div>

          <div className="floating-card card2">
            <FaCheckCircle />
            <div>
              <h4>Verified</h4>
              <p>Secure Payments</p>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
              alt="Freelancers"
            />
          </div>

        </div>
      </section>

      {/* CATEGORIES */}
      <section className="categories">

        <div className="section-header">
          <h2>Popular Categories</h2>
          <p>Explore services you need for your business.</p>
        </div>

        <div className="category-grid">

          <div className="category-card">
            <FaCode className="category-icon" />
            <h3>Web Development</h3>
            <p>React, Node.js, MERN, APIs</p>
          </div>

          <div className="category-card">
            <FaPaintBrush className="category-icon" />
            <h3>UI/UX Design</h3>
            <p>Figma, Adobe XD, Branding</p>
          </div>

          <div className="category-card">
            <FaBullhorn className="category-icon" />
            <h3>Digital Marketing</h3>
            <p>SEO, Ads, Social Growth</p>
          </div>

          <div className="category-card">
            <FaVideo className="category-icon" />
            <h3>Video Editing</h3>
            <p>YouTube, Reels, Motion Design</p>
          </div>

        </div>
      </section>

      {/* FEATURED JOBS */}
      <section className="jobs">

        <div className="section-header">
          <h2>Featured Jobs</h2>
          <p>Latest projects posted by clients.</p>
        </div>

        <div className="job-grid">

          <div className="job-card">
            <div className="job-top">
              <span className="job-tag">Full Stack</span>
              <span>$1200</span>
            </div>

            <h3>MERN Stack Developer Needed</h3>

            <p>
              Looking for an experienced MERN developer
              for a startup dashboard project.
            </p>

            <button>
              Apply Now <FaArrowRight />
            </button>
          </div>

          <div className="job-card">
            <div className="job-top">
              <span className="job-tag">Design</span>
              <span>$800</span>
            </div>

            <h3>Mobile App UI Designer</h3>

            <p>
              Create modern mobile screens and user
              experiences for a fintech app.
            </p>

            <button>
              Apply Now <FaArrowRight />
            </button>
          </div>

          <div className="job-card">
            <div className="job-top">
              <span className="job-tag">Marketing</span>
              <span>$500</span>
            </div>

            <h3>Social Media Expert</h3>

            <p>
              Need a growth expert for Instagram
              and YouTube marketing campaigns.
            </p>

            <button>
              Apply Now <FaArrowRight />
            </button>
          </div>

        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why-us">

        <div className="section-header">
          <h2>Why Choose Us</h2>
          <p>Built for freelancers and businesses.</p>
        </div>

        <div className="why-grid">

          <div className="why-card">
            <FaShieldAlt className="why-icon" />
            <h3>Secure Payments</h3>
            <p>Escrow protection for every transaction.</p>
          </div>

          <div className="why-card">
            <FaCheckCircle className="why-icon" />
            <h3>Verified Talent</h3>
            <p>Hire trusted professionals with confidence.</p>
          </div>

          <div className="why-card">
            <FaStar className="why-icon" />
            <h3>Top Quality</h3>
            <p>Get work delivered by highly rated experts.</p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta">

        <h2>Ready To Start Your Freelance Journey?</h2>

        <p>
          Join thousands of freelancers and businesses today.
        </p>
// redeploy test
        <button>
          Get Started Free
        </button>

      </section>

    </div>
  );
};

export default Home;