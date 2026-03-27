// src/Pages/customer/components/Forms/ConstructionForm.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerProfile } from "../../../../store/slices/customerProfileSlice";
import axios from "axios";
import "./ConstructionForm.css";
import { useValidation } from "../../../../context/ValidationContext";

const MAX_FLOOR_FILES = 3;
const ALLOWED_FLOOR_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_MB = 5;

const ConstructionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    validateRequired,
    validateEmail,
    validatePhone,
    validatePincode,
    validateNumber,
    validateBudget,
    validateDescription,
    validateFile,
    validateName, // keep name validator
    validateCity,
    validateState,
    validateCompanyName,
    validateFutureDate,
  } = useValidation();

  const [companyId, setCompanyId] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setCompanyId(params.get("companyId") || "");
  }, [location.search]);

  // Get customer profile from Redux
  const customerProfile = useSelector((state) => state.customerProfile);

  const [formData, setFormData] = useState({
    projectName: "",
    buildingType: "",
    customerName: customerProfile.name || "",
    customerEmail: customerProfile.email || "",
    customerPhone: customerProfile.phone || "",
    totalArea: "",
    estimatedBudget: "",
    projectTimeline: "",
    projectLocation: "",
    projectAddress: "",
    totalFloors: "",
    accessibilityNeeds: "",
    energyEfficiency: "",
    specialRequirements: "",
    companyName: "",
    projectCity: "",
    projectState: "",
  });

  // Update form fields if profile changes and fields are empty
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customerName: prev.customerName || customerProfile.name || "",
      customerEmail: prev.customerEmail || customerProfile.email || "",
      customerPhone: prev.customerPhone || customerProfile.phone || "",
    }));
    // eslint-disable-next-line
  }, [customerProfile.name, customerProfile.email, customerProfile.phone]);

  // Fetch profile on mount if not loaded yet
  useEffect(() => {
    if (
      !customerProfile.name &&
      !customerProfile.email &&
      !customerProfile.phone &&
      customerProfile.status !== "loading"
    ) {
      dispatch(fetchCustomerProfile());
    }
    // eslint-disable-next-line
  }, []);

  const [floors, setFloors] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const generateFloors = () => {
    const total = parseInt(formData.totalFloors, 10);
    const newErrors = { ...errors };
    delete newErrors.totalFloors;

    if (!Number.isInteger(total) || total <= 0) {
      newErrors.totalFloors = "Please enter a valid positive number of floors";
      setErrors(newErrors);
      return;
    }

    const newFloors = Array.from({ length: total }, (_, i) => ({
      id: i + 1,
      floorType: "",
      floorArea: "",
      floorDescription: "",
      floorImage: null,
      preview: null,
    }));
    setFloors(newFloors);
    setErrors(newErrors);
  };

  const updateFloor = (id, field, value) => {
    setFloors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    );
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${field}-${id}`];
      return copy;
    });
  };

  const removeFloor = (id) => {
    setFloors((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFloorImage = (id, file) => {
    if (!file) return;
    const fileErr = validateFile(file, ALLOWED_FLOOR_FILE_TYPES, MAX_FILE_MB);
    if (fileErr) {
      setErrors((p) => ({ ...p, [`floorImage-${id}`]: fileErr }));
      return;
    }
    // limit files per floor
    setFloors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, floorImage: file } : f)),
    );
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFloors((prev) =>
          prev.map((f) => (f.id === id ? { ...f, preview: reader.result } : f)),
        );
      };
      reader.readAsDataURL(file);
    } else {
      setFloors((prev) =>
        prev.map((f) => (f.id === id ? { ...f, preview: null } : f)),
      );
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`floorImage-${id}`];
      return copy;
    });
  };

  const validateForm = () => {
    const v = {};

    // use same strict name validation for project name as full name
    const pnErr = validateName(formData.projectName, "Project name");
    if (pnErr) v.projectName = pnErr;

    const btErr = validateRequired(formData.buildingType, "Building type");
    if (btErr) v.buildingType = btErr;

    const nameErr = validateName(formData.customerName, "Full name");
    if (nameErr) v.customerName = nameErr;

    const emailErr = validateEmail(formData.customerEmail);
    if (emailErr) v.customerEmail = emailErr;

    const phoneErr = validatePhone(formData.customerPhone);
    if (phoneErr) v.customerPhone = phoneErr;

    const areaErr = validateNumber(formData.totalArea, "Total area", 1);
    if (areaErr) v.totalArea = areaErr;

    const budgetErr = validateBudget(formData.estimatedBudget, 1000000000);
    if (budgetErr) v.estimatedBudget = budgetErr;

    const timelineErr = validateNumber(
      formData.projectTimeline,
      "Project timeline",
      1,
    );
    if (timelineErr) v.projectTimeline = timelineErr;

    const pinErr = validatePincode(formData.projectLocation);
    if (pinErr) v.projectLocation = pinErr;

    const addressErr = validateRequired(
      formData.projectAddress,
      "Project address",
    );
    if (addressErr) v.projectAddress = addressErr;

    if (formData.projectCity) {
      const cityErr = validateCity(formData.projectCity);
      if (cityErr) v.projectCity = cityErr;
    }

    if (formData.projectState) {
      const stateErr = validateState(formData.projectState);
      if (stateErr) v.projectState = stateErr;
    }

    if (formData.companyName) {
      const compErr = validateCompanyName(formData.companyName);
      if (compErr) v.companyName = compErr;
    }

    const floorsCount = parseInt(formData.totalFloors, 10);
    if (floorsCount > 0 && floors.length === 0) {
      v.totalFloors = "Please generate floor details";
    } else {
      floors.forEach((floor) => {
        const ftErr = validateRequired(
          floor.floorType,
          `Floor ${floor.id} type`,
        );
        if (ftErr) v[`floorType-${floor.id}`] = ftErr;

        const faErr = validateNumber(
          floor.floorArea,
          `Floor ${floor.id} area`,
          0.1,
        );
        if (faErr) v[`floorArea-${floor.id}`] = faErr;

        const fdErr = validateDescription(
          floor.floorDescription || "",
          1,
          2000,
        );
        if (fdErr) v[`floorDescription-${floor.id}`] = fdErr;

        if (floor.floorImage) {
          const fErr = validateFile(
            floor.floorImage,
            ALLOWED_FLOOR_FILE_TYPES,
            MAX_FILE_MB,
          );
          if (fErr) v[`floorImage-${floor.id}`] = fErr;
        }
      });
    }

    // site files
    const siteFilesInput = document.getElementById("siteFiles");
    if (siteFilesInput?.files && siteFilesInput.files.length > 0) {
      for (let file of siteFilesInput.files) {
        const sfErr = validateFile(file, ALLOWED_FLOOR_FILE_TYPES, MAX_FILE_MB);
        if (sfErr) {
          v.siteFiles = sfErr;
          break;
        }
      }
    }

    const specReqErr = validateDescription(
      formData.specialRequirements || "",
      0,
      3000,
    );
    if (specReqErr) v.specialRequirements = specReqErr;

    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) return;

    setSubmitting(true);
    const submitData = new FormData();
    if (companyId) submitData.append("companyId", companyId);
    Object.entries(formData).forEach(([k, v]) => submitData.append(k, v));

    floors.forEach((floor) => {
      submitData.append(`floorNumber-${floor.id}`, floor.id);
      submitData.append(`floorType-${floor.id}`, floor.floorType);
      submitData.append(`floorArea-${floor.id}`, floor.floorArea);
      submitData.append(`floorDescription-${floor.id}`, floor.floorDescription);
      if (floor.floorImage)
        submitData.append(`floorImage-${floor.id}`, floor.floorImage);
    });

    const siteFilesInput = document.getElementById("siteFiles");
    if (siteFilesInput?.files) {
      Array.from(siteFilesInput.files).forEach((file) =>
        submitData.append("siteFiles", file),
      );
    }

    try {
      const res = await axios.post("/api/construction_form", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data && res.data.success) {
        navigate("/customerdashboard/job_status");
      } else {
        setErrors((p) => ({
          ...p,
          submit: res.data?.message || "Failed to submit project",
        }));
      }
    } catch (err) {
      setErrors((p) => ({
        ...p,
        submit: err.response?.data?.error || "Network error while submitting",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="constructionform-container">
      <div className="constructionform-page-title">
        <h1>Construction Project Submission</h1>
        <div className="constructionform-underline" />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <input type="hidden" name="companyId" value={companyId} />

        <div className="constructionform-form-section">
          <h2>Project Information</h2>
          <div className="constructionform-form-grid">
            <div className="constructionform-form-group">
              <label
                htmlFor="projectName"
                className="constructionform-required"
              >
                Project Name
              </label>
              <input
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
              />
              {errors.projectName && (
                <div className="constructionform-error-text">
                  {errors.projectName}
                </div>
              )}
            </div>

            <div className="constructionform-form-group">
              <label
                htmlFor="buildingType"
                className="constructionform-required"
              >
                Building Type
              </label>
              <select
                id="buildingType"
                name="buildingType"
                value={formData.buildingType}
                onChange={handleInputChange}
              >
                <option value="">Select Building Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="mixedUse">Mixed Use</option>
                <option value="other">Other</option>
              </select>
              {errors.buildingType && (
                <div className="constructionform-error-text">
                  {errors.buildingType}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="constructionform-form-section">
          <h2>Customer Information</h2>
          <div className="constructionform-form-grid">
            <div className="constructionform-form-group">
              <label
                htmlFor="customerName"
                className="constructionform-required"
              >
                Full Name
              </label>
              <input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
              />
              {errors.customerName && (
                <div className="constructionform-error-text">
                  {errors.customerName}
                </div>
              )}
            </div>
            <div className="constructionform-form-group">
              <label
                htmlFor="customerEmail"
                className="constructionform-required"
              >
                Email Address
              </label>
              <input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
              />
              {errors.customerEmail && (
                <div className="constructionform-error-text">
                  {errors.customerEmail}
                </div>
              )}
            </div>
            <div className="constructionform-form-group">
              <label
                htmlFor="customerPhone"
                className="constructionform-required"
              >
                Phone Number
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={handleInputChange}
              />
              {errors.customerPhone && (
                <div className="constructionform-error-text">
                  {errors.customerPhone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="constructionform-form-section">
          <h2>Project Details</h2>
          <div className="constructionform-form-grid">
            <div className="constructionform-form-group">
              <label htmlFor="totalArea" className="constructionform-required">
                Total Building Area (sq meters)
              </label>
              <input
                id="totalArea"
                name="totalArea"
                type="number"
                step="0.1"
                value={formData.totalArea}
                onChange={handleInputChange}
              />
              {errors.totalArea && (
                <div className="constructionform-error-text">
                  {errors.totalArea}
                </div>
              )}
            </div>

            <div className="constructionform-form-group">
              <label
                htmlFor="estimatedBudget"
                className="constructionform-required"
              >
                Estimated Budget (₹)
              </label>
              <input
                id="estimatedBudget"
                name="estimatedBudget"
                value={formData.estimatedBudget}
                onChange={handleInputChange}
              />
              {errors.estimatedBudget && (
                <div className="constructionform-error-text">
                  {errors.estimatedBudget}
                </div>
              )}
            </div>

            <div className="constructionform-form-group">
              <label
                htmlFor="projectTimeline"
                className="constructionform-required"
              >
                Expected Timeline (months)
              </label>
              <input
                id="projectTimeline"
                name="projectTimeline"
                type="number"
                step="1"
                value={formData.projectTimeline}
                onChange={handleInputChange}
              />
              {errors.projectTimeline && (
                <div className="constructionform-error-text">
                  {errors.projectTimeline}
                </div>
              )}
            </div>

            <div className="constructionform-form-group">
              <label
                htmlFor="projectLocation"
                className="constructionform-required"
              >
                Project Location Pincode
              </label>
              <input
                id="projectLocation"
                name="projectLocation"
                value={formData.projectLocation}
                onChange={handleInputChange}
                placeholder="e.g., 534260"
              />
              {errors.projectLocation && (
                <div className="constructionform-error-text">
                  {errors.projectLocation}
                </div>
              )}
            </div>
          </div>

          <div className="constructionform-form-group">
            <label
              htmlFor="projectAddress"
              className="constructionform-required"
            >
              Project Address
            </label>
            <textarea
              id="projectAddress"
              name="projectAddress"
              value={formData.projectAddress}
              onChange={handleInputChange}
            />
            {errors.projectAddress && (
              <div className="constructionform-error-text">
                {errors.projectAddress}
              </div>
            )}
          </div>

          <div className="constructionform-form-grid">
            <div className="constructionform-form-group">
              <label htmlFor="projectCity">City</label>
              <input
                id="projectCity"
                name="projectCity"
                value={formData.projectCity}
                onChange={handleInputChange}
              />
              {errors.projectCity && (
                <div className="constructionform-error-text">
                  {errors.projectCity}
                </div>
              )}
            </div>
            <div className="constructionform-form-group">
              <label htmlFor="projectState">State</label>
              <input
                id="projectState"
                name="projectState"
                value={formData.projectState}
                onChange={handleInputChange}
              />
              {errors.projectState && (
                <div className="constructionform-error-text">
                  {errors.projectState}
                </div>
              )}
            </div>
            <div className="constructionform-form-group">
              <label htmlFor="companyName">Company (optional)</label>
              <input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
              />
              {errors.companyName && (
                <div className="constructionform-error-text">
                  {errors.companyName}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="constructionform-form-section">
          <h2>Floor Plans</h2>
          <div className="constructionform-form-group">
            <label htmlFor="totalFloors" className="constructionform-required">
              Number of Floors
            </label>
            <input
              id="totalFloors"
              name="totalFloors"
              type="number"
              min="1"
              value={formData.totalFloors}
              onChange={handleInputChange}
            />
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="constructionform-btn"
                onClick={generateFloors}
                disabled={!formData.totalFloors}
              >
                Generate Floor Details
              </button>
            </div>
            {errors.totalFloors && (
              <div className="constructionform-error-text">
                {errors.totalFloors}
              </div>
            )}
          </div>

          <div id="constructionform-floorDetails">
            {floors.map((floor) => (
              <div key={floor.id} className="constructionform-floor-container">
                <div className="constructionform-floor-header">
                  <h3>Floor {floor.id}</h3>
                  <button
                    type="button"
                    className="constructionform-btn constructionform-btn-remove"
                    onClick={() => removeFloor(floor.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="constructionform-form-grid">
                  <div className="constructionform-form-group">
                    <label htmlFor={`floorType-${floor.id}`}>Floor Type</label>
                    <select
                      id={`floorType-${floor.id}`}
                      value={floor.floorType}
                      onChange={(e) =>
                        updateFloor(floor.id, "floorType", e.target.value)
                      }
                    >
                      <option value="">Select Floor Type</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="parking">Parking</option>
                      <option value="mechanical">Mechanical/Utility</option>
                      <option value="other">Other</option>
                    </select>
                    {errors[`floorType-${floor.id}`] && (
                      <div className="constructionform-error-text">
                        {errors[`floorType-${floor.id}`]}
                      </div>
                    )}
                  </div>

                  <div className="constructionform-form-group">
                    <label htmlFor={`floorArea-${floor.id}`}>
                      Floor Area (sq meters)
                    </label>
                    <input
                      id={`floorArea-${floor.id}`}
                      type="number"
                      step="0.1"
                      value={floor.floorArea}
                      onChange={(e) =>
                        updateFloor(floor.id, "floorArea", e.target.value)
                      }
                    />
                    {errors[`floorArea-${floor.id}`] && (
                      <div className="constructionform-error-text">
                        {errors[`floorArea-${floor.id}`]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="constructionform-form-group">
                  <label htmlFor={`floorDescription-${floor.id}`}>
                    Floor Description
                  </label>
                  <textarea
                    id={`floorDescription-${floor.id}`}
                    value={floor.floorDescription}
                    onChange={(e) =>
                      updateFloor(floor.id, "floorDescription", e.target.value)
                    }
                    placeholder="Describe layout/purpose"
                  />
                  {errors[`floorDescription-${floor.id}`] && (
                    <div className="constructionform-error-text">
                      {errors[`floorDescription-${floor.id}`]}
                    </div>
                  )}
                </div>

                <div className="constructionform-form-group">
                  <label htmlFor={`floorImage-${floor.id}`}>
                    Floor Plan Image (optional)
                  </label>
                  <input
                    id={`floorImage-${floor.id}`}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      handleFloorImage(floor.id, e.target.files[0])
                    }
                  />
                  {errors[`floorImage-${floor.id}`] && (
                    <div className="constructionform-error-text">
                      {errors[`floorImage-${floor.id}`]}
                    </div>
                  )}
                  {floor.preview && (
                    <img
                      src={floor.preview}
                      alt={`Floor ${floor.id} preview`}
                      className="constructionform-image-preview"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="constructionform-form-section">
          <h2>Additional Requirements</h2>

          <div className="constructionform-form-grid">
            <div className="constructionform-form-group">
              <label htmlFor="accessibilityNeeds">Accessibility Needs</label>
              <select
                id="accessibilityNeeds"
                name="accessibilityNeeds"
                value={formData.accessibilityNeeds}
                onChange={handleInputChange}
              >
                <option value="">Select Options</option>
                <option value="wheelchair">Wheelchair Accessibility</option>
                <option value="elevators">Elevators</option>
                <option value="ramps">Ramps</option>
                <option value="other">Other</option>
                <option value="none">None</option>
              </select>
              {errors.accessibilityNeeds && (
                <div className="constructionform-error-text">
                  {errors.accessibilityNeeds}
                </div>
              )}
            </div>

            <div className="constructionform-form-group">
              <label htmlFor="energyEfficiency">Energy Efficiency Goals</label>
              <select
                id="energyEfficiency"
                name="energyEfficiency"
                value={formData.energyEfficiency}
                onChange={handleInputChange}
              >
                <option value="">Select Options</option>
                <option value="standard">Standard</option>
                <option value="leed">LEED Certified</option>
                <option value="passive">Passive House</option>
                <option value="netZero">Net Zero</option>
                <option value="other">Other</option>
              </select>
              {errors.energyEfficiency && (
                <div className="constructionform-error-text">
                  {errors.energyEfficiency}
                </div>
              )}
            </div>
          </div>

          <div className="constructionform-form-group">
            <label htmlFor="specialRequirements">
              Special Requirements or Considerations
            </label>
            <textarea
              id="specialRequirements"
              name="specialRequirements"
              value={formData.specialRequirements}
              onChange={handleInputChange}
              placeholder="List any special requirements, materials, or considerations"
            />
            {errors.specialRequirements && (
              <div className="constructionform-error-text">
                {errors.specialRequirements}
              </div>
            )}
          </div>

          <div className="constructionform-form-group">
            <label htmlFor="siteFiles">
              Site Plans or Additional Documents (Optional)
            </label>
            <input
              id="siteFiles"
              name="siteFiles"
              type="file"
              multiple
              accept="image/*,application/pdf"
            />
            {errors.siteFiles && (
              <div className="constructionform-error-text">
                {errors.siteFiles}
              </div>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="constructionform-error-text">{errors.submit}</div>
        )}

        <div className="constructionform-submit-section">
          <button
            type="submit"
            className="constructionform-btn constructionform-submit-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Project"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConstructionForm;
