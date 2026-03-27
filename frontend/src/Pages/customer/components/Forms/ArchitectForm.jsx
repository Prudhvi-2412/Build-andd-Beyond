import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomerProfile } from '../../../../store/slices/customerProfileSlice';
import axios from "axios";
import "./ArchitectForm.css";

const ArchitectForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const customerProfile = useSelector((state) => state.customerProfile);

  // ---------- URL workerId ----------
  const [workerId, setWorkerId] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setWorkerId(params.get("workerId") || "");
  }, [location.search]);

  // ---------- Form state ----------
  const [form, setForm] = useState({
    projectName: "",
    designType: "",
    architecturalStyle: "",
    fullName: customerProfile.name || "",
    contactNumber: customerProfile.phone || "",
    email: customerProfile.email || "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    plotLocation: "",
    plotSize: "",
    plotOrientation: "",
    numFloors: "",
    budget: "",
    completionDate: "",
    specialFeatures: "",
    floorRequirements: [], // array of { floorNumber, details }
  });

  // Update form fields if profile changes and fields are empty
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || customerProfile.name || "",
      contactNumber: prev.contactNumber || customerProfile.phone || "",
      email: prev.email || customerProfile.email || "",
    }));
    // eslint-disable-next-line
  }, [customerProfile.name, customerProfile.email, customerProfile.phone]);

  // Fetch profile on mount if not loaded yet
  useEffect(() => {
    if (!customerProfile.name && !customerProfile.email && !customerProfile.phone && customerProfile.status !== 'loading') {
      dispatch(fetchCustomerProfile());
    }
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // ---------- Dynamic floor requirements ----------
  const [floorFields, setFloorFields] = useState([]);

  useEffect(() => {
    const num = parseInt(form.numFloors);
    if (isNaN(num) || num < 1) {
      setFloorFields([]);
      setForm((p) => ({ ...p, floorRequirements: [] }));
      return;
    }

    const fields = [];
    const requirements = [];

    for (let i = 1; i <= num; i++) {
      const existing = form.floorRequirements.find((f) => f.floorNumber === i);
      const details = existing?.details || "";

      fields.push({ floorNumber: i, details });
      requirements.push({ floorNumber: i, details });
    }

    setFloorFields(fields);
    setForm((p) => ({ ...p, floorRequirements: requirements }));
  }, [form.numFloors]);

  const handleFloorChange = (index, value) => {
    const updated = [...form.floorRequirements];
    updated[index] = { ...updated[index], details: value };
    setForm((p) => ({ ...p, floorRequirements: updated }));
  };

  // ---------- File handling ----------
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowed = ["image/jpeg", "image/png", "application/pdf"];

    const valid = selected.filter((f) => {
      if (f.size > maxSize) {
        alert(`File ${f.name} exceeds 5MB limit.`);
        return false;
      }
      if (!allowed.includes(f.type)) {
        alert(`File ${f.name} must be JPG, PNG or PDF.`);
        return false;
      }
      return true;
    });

    setFiles((p) => [...p, ...valid]);

    const newPreviews = valid.map((f) => ({
      file: f,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      type: f.type.startsWith("image/") ? "image" : "pdf",
    }));
    setPreviews((p) => [...p, ...newPreviews]);
  };

  const removeFile = (idx) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  // ---------- Validation ----------
  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};
    const required = [
      "projectName",
      "designType",
      "architecturalStyle",
      "fullName",
      "contactNumber",
      "email",
      "streetAddress",
      "city",
      "state",
      "zipCode",
      "plotLocation",
      "plotSize",
      "plotOrientation",
      "numFloors",
      "budget",
      "completionDate",
    ];

    required.forEach((f) => {
      if (!form[f].trim()) err[f] = "This field is required";
    });

    // Email
    const emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (form.email && !emailRe.test(form.email))
      err.email =
        "Please enter a valid email address (e.g., example@domain.com)";

    // Plot size – number
    const plotRe = /^\d*\.?\d+$/;
    if (form.plotSize && !plotRe.test(form.plotSize))
      err.plotSize = "Plot size must be a number (e.g., 150 or 150.5)";

    // Phone
    let digits = form.contactNumber.replace(/\D/g, "");
    if (form.contactNumber) {
      if (form.contactNumber.startsWith("0")) {
        digits = digits.slice(1);
        if (!/^\d{10}$/.test(digits))
          err.contactNumber =
            "Please enter a valid phone number with exactly 10 digits after a leading 0 (e.g., 01234567890)";
      } else {
        if (!/^\d{10}$/.test(digits))
          err.contactNumber =
            "Please enter a valid 10-digit phone number (e.g., 1234567890)";
      }
    }

    // Completion date – future
    if (form.completionDate) {
      const sel = new Date(form.completionDate);
      const now = new Date();
      if (sel <= now)
        err.completionDate = "Completion date must be greater than today";
    }

    // Zipcode – 6 digits
    if (form.zipCode && !/^\d{6}$/.test(form.zipCode))
      err.zipCode = "Pincode must be exactly 6 digits";

    // Floor details
    if (form.numFloors && form.floorRequirements.length > 0) {
      form.floorRequirements.forEach((floor, i) => {
        if (!floor.details.trim()) {
          err[`floor${i + 1}`] = `Floor ${i + 1} details are required`;
        }
      });
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append("workerId", workerId);
    Object.entries(form).forEach(([k, v]) => {
      if (k === "floorRequirements") {
        v.forEach((floor, i) => {
          fd.append(`floorRequirements[${i}][floorNumber]`, floor.floorNumber);
          fd.append(`floorRequirements[${i}][details]`, floor.details);
        });
      } else {
        fd.append(k, v);
      }
    });
    files.forEach((f) => fd.append("referenceImages", f));

    try {
      const res = await axios.post("/api/architect_submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.redirect) {
        alert("Form submitted successfully!");
        navigate("/customerdashboard/job_status");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert("Submission failed: " + msg);
    }
  };

  // ---------- Render ----------
  return (
    <div className="architect-form-container">
      <div className="architect-form-page-title">
        <h1>Architectural Design Request Form</h1>
        <div className="architect-form-underline"></div>
      </div>

      <form
        id="architect-form-designRequestForm"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        noValidate
      >
        <input type="hidden" name="workerId" value={workerId} />

        {/* ---------- Project Information ---------- */}
        <div className="architect-form-section">
          <h2 className="architect-form-section-title">Project Information</h2>

          <div className="architect-form-form-group">
            <label htmlFor="projectName">Project Name*</label>
            <input
              type="text"
              id="projectName"
              name="projectName"
              value={form.projectName}
              onChange={handleChange}
              required
            />
            {errors.projectName && (
              <div className="architect-form-error-message">
                {errors.projectName}
              </div>
            )}
          </div>

          <div className="architect-form-form-grid">
            <div className="architect-form-form-group">
              <label htmlFor="designType">Type of Design*</label>
              <select
                id="designType"
                name="designType"
                value={form.designType}
                onChange={handleChange}
                required
              >
                <option value="">Select Design Type</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Landscape">Landscape</option>
                <option value="Mixed-Use">Mixed-Use</option>
                <option value="Industrial">Industrial</option>
                <option value="Other">Other</option>
              </select>
              {errors.designType && (
                <div className="architect-form-error-message">
                  {errors.designType}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="architecturalStyle">
                Preferred Architectural Style*
              </label>
              <select
                id="architecturalStyle"
                name="architecturalStyle"
                value={form.architecturalStyle}
                onChange={handleChange}
                required
              >
                <option value="">Select Style</option>
                <option value="Modern">Modern</option>
                <option value="Traditional">Traditional</option>
                <option value="Contemporary">Contemporary</option>
                <option value="Minimalist">Minimalist</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="Victorian">Victorian</option>
                <option value="Colonial">Colonial</option>
                <option value="Industrial">Industrial</option>
                <option value="Other">Other</option>
              </select>
              {errors.architecturalStyle && (
                <div className="architect-form-error-message">
                  {errors.architecturalStyle}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Customer Details ---------- */}
        <div className="architect-form-section">
          <h2 className="architect-form-section-title">Customer Details</h2>

          <div className="architect-form-form-grid">
            <div className="architect-form-form-group">
              <label htmlFor="fullName">Full Name*</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />
              {errors.fullName && (
                <div className="architect-form-error-message">
                  {errors.fullName}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="contactNumber">Contact Number*</label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                required
              />
              {errors.contactNumber && (
                <div className="architect-form-error-message">
                  {errors.contactNumber}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="email">Email Address*</label>
              <input
                type="text"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <div className="architect-form-error-message">
                  {errors.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Customer Address ---------- */}
        <div className="architect-form-section">
          <h2 className="architect-rection-title">Customer Address</h2>

          <div className="architect-form-form-group">
            <label htmlFor="streetAddress">Street Address*</label>
            <input
              type="text"
              id="streetAddress"
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleChange}
              required
            />
            {errors.streetAddress && (
              <div className="architect-form-error-message">
                {errors.streetAddress}
              </div>
            )}
          </div>

          <div className="architect-form-form-grid">
            <div className="architect-form-form-group">
              <label htmlFor="city">City*</label>
              <input
                type="text"
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
              {errors.city && (
                <div className="architect-form-error-message">
                  {errors.city}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="state">State*</label>
              <input
                type="text"
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
              />
              {errors.state && (
                <div className="architect-form-error-message">
                  {errors.state}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="zipCode">Pincode*</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={form.zipCode}
                onChange={handleChange}
                required
              />
              {errors.zipCode && (
                <div className="architect-form-error-message">
                  {errors.zipCode}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Plot Information ---------- */}
        <div className="architect-form-section">
          <h2 className="architect-form-section-title">Plot Information</h2>

          <div className="architect-form-form-group">
            <label htmlFor="plotLocation">Plot Location/Address*</label>
            <input
              type="text"
              id="plotLocation"
              name="plotLocation"
              value={form.plotLocation}
              onChange={handleChange}
              required
            />
            {errors.plotLocation && (
              <div className="architect-form-error-message">
                {errors.plotLocation}
              </div>
            )}
          </div>

          <div className="architect-form-form-grid">
            <div className="architect-form-form-group">
              <label htmlFor="plotSize">Plot Size* (in sq.ft or sq.m)</label>
              <input
                type="text"
                id="plotSize"
                name="plotSize"
                value={form.plotSize}
                onChange={handleChange}
                required
              />
              {errors.plotSize && (
                <div className="architect-form-error-message">
                  {errors.plotSize}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="plotOrientation">Plot Orientation*</label>
              <select
                id="plotOrientation"
                name="plotOrientation"
                value={form.plotOrientation}
                onChange={handleChange}
                required
              >
                <option value="">Select Orientation</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North-East">North-East</option>
                <option value="North-West">North-West</option>
                <option value="South-East">South-East</option>
                <option value="South-West">South-West</option>
              </select>
              {errors.plotOrientation && (
                <div className="architect-form-error-message">
                  {errors.plotOrientation}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Design Requirements ---------- */}
        <div className="architect-form-section">
          <h2 className="architect-form-section-title">Design Requirements</h2>

          <div className="architect-form-form-grid">
            <div className="architect-form-form-group">
              <label htmlFor="numFloors">Number of Floors*</label>
              <select
                id="numFloors"
                name="numFloors"
                value={form.numFloors}
                onChange={handleChange}
                required
              >
                <option value="">Select Number</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              {errors.numFloors && (
                <div className="architect-form-error-message">
                  {errors.numFloors}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="budget">Max Budget*</label>
              <input
                type="text"
                id="budget"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                required
              />
              {errors.budget && (
                <div className="architect-form-error-message">
                  {errors.budget}
                </div>
              )}
            </div>

            <div className="architect-form-form-group">
              <label htmlFor="completionDate">
                Preferred Design Completion Date*
              </label>
              <input
                type="date"
                id="completionDate"
                name="completionDate"
                value={form.completionDate}
                onChange={handleChange}
                required
              />
              {errors.completionDate && (
                <div className="architect-form-error-message">
                  {errors.completionDate}
                </div>
              )}
            </div>
          </div>

          {/* ========== DYNAMIC FLOOR REQUIREMENTS – FIXED ========== */}
          <div id="architect-form-floorRequirements">
            {floorFields.map((floor, idx) => (
              <div key={idx} className="architect-form-form-group">
                <label htmlFor={`floor${idx + 1}`}>
                  Floor {idx + 1} Room Requirements*
                </label>

                {/* TEXTAREA FIRST – fully interactive */}
                <textarea
                  id={`floor${idx + 1}`}
                  name={`floorRequirements[${idx}][details]`}
                  value={floor.details}
                  onChange={(e) => handleFloorChange(idx, e.target.value)}
                  placeholder="e.g., 2 Bedrooms, 1 Bathroom, Living Room, etc."
                  required
                  rows={4}
                />

                {/* HIDDEN INPUT AFTER – no overlap */}
                <input
                  type="hidden"
                  name={`floorRequirements[${idx}][floorNumber]`}
                  value={floor.floorNumber}
                />

                {/* Error */}
                {errors[`floor${idx + 1}`] && (
                  <div className="architect-form-error-message">
                    {errors[`floor${idx + 1}`]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="architect-form-form-group">
            <label htmlFor="specialFeatures">Special Features</label>
            <textarea
              id="specialFeatures"
              name="specialFeatures"
              value={form.specialFeatures}
              onChange={handleChange}
              placeholder="e.g., Balcony, Garden, Parking Space, Swimming Pool, Home Theater, etc."
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div className="architect-form-form-group">
            <label>Reference Images/Sketches (if any)</label>
            <div className="architect-form-file-upload">
              <label htmlFor="referenceImages">
                Drop files here or click to upload
                <br />
                (JPG, PNG, PDF up to 5MB)
              </label>
              <input
                type="file"
                id="referenceImages"
                name="referenceImages"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
              />
            </div>
            <div className="architect-form-image-preview-container">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className={`architect-form-image-preview ${
                    p.type === "pdf" ? "architect-form-pdf-preview" : ""
                  }`}
                >
                  {p.type === "image" && <img src={p.url} alt="" />}
                  {p.type === "pdf" && (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#d9534f"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9 15h6" />
                        <path d="M9 11h6" />
                      </svg>
                      <div className="architect-form-file-name">
                        {p.file.name}
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    className="architect-form-remove-btn"
                    onClick={() => removeFile(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="architect-form-btn-submit">
          Submit Design Request
        </button>
      </form>
    </div>
  );
};

export default ArchitectForm;
