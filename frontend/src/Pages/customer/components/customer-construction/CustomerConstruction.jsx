import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CustomerConstruction.css";

const CustomerConstruction = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("/api/construction_companies_list", {
          withCredentials: true,
        });
        setCompanies(res.data.companies || []);
      } catch (err) {
        setError("Failed to load companies. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const sorted = [...companies].sort((a, b) => {
      if (sortBy === "name") {
        return a.companyName
          .toLowerCase()
          .localeCompare(b.companyName.toLowerCase());
      }
      if (sortBy === "projects") {
        return (b.projectsCompleted || 0) - (a.projectsCompleted || 0);
      }
      if (sortBy === "years") {
        return (b.yearsInBusiness || 0) - (a.yearsInBusiness || 0);
      }
      return 0;
    });
    setCompanies(sorted);
  }, [sortBy]);

  useEffect(() => {
    const handleScroll = () => {
      const btn = document.querySelector(".construction-back-to-top");
      if (btn) {
        btn.classList.toggle("construction-visible", window.scrollY > 400);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSelectedCompany(null);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const showDetails = (companyId) => {
    setSelectedCompany(companies.find((c) => c._id === companyId));
    setShowAllReviews(false);
    document.body.style.overflow = "hidden";
  };

  const closeDetails = () => {
    setSelectedCompany(null);
    setShowAllReviews(false);
    document.body.style.overflow = "auto";
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= Math.round(rating || 0) ? "filled" : ""}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="construction-page">
        <div className="status-message loading">
          <div className="spinner"></div>
          <p>Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="construction-page">
        <div className="status-message error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="construction-page">
      <div className="controls-bar">
        <div className="controls-container">
          <div className="results-count">
            <span className="count-number">{companies.length}</span>
            <span className="count-label">
              {companies.length === 1 ? "Company" : "Companies"} Available
            </span>
          </div>
          <div className="sort-wrapper">
            <label htmlFor="sort-select" className="sort-label">
              <i className="fas fa-sort-amount-down"></i>
              Sort by:
            </label>
            <select
              id="sort-select"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Company Name</option>
              <option value="projects">Most Projects</option>
              <option value="years">Years of Experience</option>
            </select>
          </div>
        </div>
      </div>

      <div className="companies-grid">
        {companies.length > 0 ? (
          companies.map((company) => (
            <div
              key={company._id}
              className="company-card"
              data-id={company._id}
            >
              <div className="card-header">
                <h3 className="company-name">{company.companyName}</h3>
                <div className="company-stats-inline">
                  <div className="stat-pill">
                    <i className="fas fa-briefcase"></i>
                    <span>{company.projectsCompleted || 0}+ Projects</span>
                  </div>
                  <div className="stat-pill">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{company.yearsInBusiness || 0} Years</span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <p className="company-description">
                  {company.aboutCompany ||
                    "Leading construction company with expertise in residential and commercial buildings, infrastructure development, and engineering services."}
                </p>

                <div className="company-location">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>
                    {company.location?.city
                      ? `${company.location.city}, India`
                      : "Location not specified, India"}
                  </span>
                </div>

                {company.totalReviews > 0 && (
                  <div className="rating-badge">
                    {renderStars(company.averageRating)}
                    <div className="rating-info">
                      <span className="rating-score">
                        {company.averageRating.toFixed(1)}
                      </span>
                      <span className="rating-count">
                        ({company.totalReviews}{" "}
                        {company.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => showDetails(company._id)}
                >
                  <i className="fas fa-info-circle"></i>
                  View Details
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(
                      `/customerdashboard/constructionform?companyId=${company._id}`,
                    )
                  }
                >
                  <i className="fas fa-paper-plane"></i>
                  Book Now
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <p>No construction companies found.</p>
          </div>
        )}
      </div>

      {selectedCompany && (
        <div className="modal-overlay active" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDetails}>
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-header">
              <h2 className="modal-title">{selectedCompany.companyName}</h2>
              {selectedCompany.contactPerson && (
                <p className="modal-subtitle">
                  Contact: {selectedCompany.contactPerson}
                </p>
              )}
            </div>

            <section className="modal-section">
              <h3 className="section-title">Company Overview</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {selectedCompany.projectsCompleted || 0}+
                    </div>
                    <div className="stat-label">Projects Completed</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-history"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {selectedCompany.yearsInBusiness || 0}
                    </div>
                    <div className="stat-label">Years in Business</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {selectedCompany.size || "N/A"}
                    </div>
                    <div className="stat-label">Employees</div>
                  </div>
                </div>
              </div>
              <p className="section-description">
                {selectedCompany.aboutForCustomers ||
                  "Company description not available."}
              </p>
            </section>

            {selectedCompany.completedProjects &&
              selectedCompany.completedProjects.length > 0 && (
                <section className="modal-section">
                  <h3 className="section-title">
                    <i className="fas fa-building"></i>
                    Completed Projects
                  </h3>
                  <div className="projects-list">
                    {selectedCompany.completedProjects.map((project, idx) => (
                      <div key={idx} className="project-card">
                        {(project.beforeImage || project.afterImage) && (
                          <div className="project-gallery">
                            {project.beforeImage && (
                              <div className="gallery-item">
                                <img
                                  src={project.beforeImage}
                                  alt={`${project.title} - Before`}
                                />
                                <span className="gallery-label">Before</span>
                              </div>
                            )}
                            {project.afterImage && (
                              <div className="gallery-item">
                                <img
                                  src={project.afterImage}
                                  alt={`${project.title} - After`}
                                />
                                <span className="gallery-label">After</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="project-info">
                          <h4 className="project-title">{project.title}</h4>
                          <p className="project-description">
                            {project.description}
                          </p>
                          <div className="project-meta">
                            {project.location && (
                              <div className="meta-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>{project.location}</span>
                              </div>
                            )}
                            {project.tenderId && (
                              <div className="meta-item">
                                <i className="fas fa-file-contract"></i>
                                <span>Tender ID: {project.tenderId}</span>
                              </div>
                            )}
                          </div>
                          <div className="project-links">
                            {project.gpsLink &&
                              project.gpsLink.trim() !== "" && (
                                <a
                                  href={project.gpsLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="project-link"
                                >
                                  <i className="fas fa-map"></i>
                                  View on Map
                                </a>
                              )}
                            {project.materialCertificate &&
                              project.materialCertificate.trim() !== "" &&
                              (project.materialCertificate.startsWith("http") ||
                                project.materialCertificate.startsWith(
                                  "https",
                                )) && (
                                <a
                                  href={project.materialCertificate}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="project-link"
                                >
                                  <i className="fas fa-certificate"></i>
                                  Material Certificate
                                </a>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {selectedCompany.completedProjectsWithReviews &&
              selectedCompany.completedProjectsWithReviews.length > 0 && (
                <section className="modal-section reviews-section">
                  <h3 className="section-title">
                    <i className="fas fa-star"></i>
                    Customer Reviews
                  </h3>

                  <div className="rating-summary">
                    <div className="summary-score">
                      <div className="score-number">
                        {selectedCompany.averageRating.toFixed(1)}
                      </div>
                      {renderStars(selectedCompany.averageRating)}
                      <div className="score-text">
                        Based on {selectedCompany.totalReviews}{" "}
                        {selectedCompany.totalReviews === 1
                          ? "review"
                          : "reviews"}
                      </div>
                    </div>
                  </div>

                  <div className="reviews-list">
                    {selectedCompany.completedProjectsWithReviews
                      .slice(
                        0,
                        showAllReviews
                          ? selectedCompany.completedProjectsWithReviews.length
                          : 2,
                      )
                      .map((project, idx) => (
                        <div key={idx} className="review-card">
                          <div className="review-header">
                            <h4 className="review-project-name">
                              {project.projectName}
                            </h4>
                            <div className="review-rating">
                              {renderStars(project.customerReview?.rating)}
                              <span className="rating-number">
                                {project.customerReview?.rating || 0}/5
                              </span>
                            </div>
                          </div>

                          {project.completionImages &&
                            project.completionImages.length > 0 && (
                              <div className="review-gallery">
                                <h5 className="gallery-title">
                                  <i className="fas fa-images"></i>
                                  Project Completion Photos
                                </h5>
                                <div className="images-grid">
                                  {project.completionImages.map(
                                    (img, imgIdx) => (
                                      <img
                                        key={imgIdx}
                                        src={`http://localhost:3000/${img}`}
                                        alt={`Completion ${imgIdx + 1}`}
                                        className="completion-image"
                                        onClick={() =>
                                          window.open(
                                            `http://localhost:3000/${img}`,
                                            "_blank",
                                          )
                                        }
                                      />
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {project.customerReview?.reviewText && (
                            <blockquote className="review-text">
                              "{project.customerReview.reviewText}"
                            </blockquote>
                          )}

                          {project.customerReview?.reviewDate && (
                            <div className="review-date">
                              {new Date(
                                project.customerReview.reviewDate,
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  {selectedCompany.completedProjectsWithReviews.length > 2 && (
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                    >
                      {showAllReviews ? "Show Less" : "View All Reviews"}
                    </button>
                  )}
                </section>
              )}

            {selectedCompany.didYouKnow && (
              <section className="modal-section highlight-section">
                <h3 className="section-title">
                  <i className="fas fa-lightbulb"></i>
                  Did You Know?
                </h3>
                <p className="section-description">
                  {selectedCompany.didYouKnow}
                </p>
              </section>
            )}

            <div className="modal-footer">
              <button
                className="btn btn-primary btn-large"
                onClick={() => {
                  document.body.style.overflow = "auto";
                  navigate(
                    `/customerdashboard/constructionform?companyId=${selectedCompany._id}`,
                  );
                }}
              >
                <i className="fas fa-paper-plane"></i>
                Book This Company
              </button>
            </div>
          </div>
        </div>
      )}

      <a
        href="#"
        className="construction-back-to-top"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <i className="fas fa-arrow-up"></i>
      </a>
    </div>
  );
};

export default CustomerConstruction;
