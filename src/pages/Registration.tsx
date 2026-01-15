import React, { useState } from "react";

function Registration() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="register-page">
      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <div className="logo-box">🧑‍💼</div>
          <h2 className="regi">Employee Registration</h2>
          <p className="para">Fill employee details to continue</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Row */}
          <div className="form-grid three">
            <div>
              <label>First Name *</label>
              <input name="firstName" onChange={handleChange} required />
            </div>
            <div>
              <label>Middle Name</label>
              <input name="middleName" onChange={handleChange} />
            </div>
            <div>
              <label>Last Name *</label>
              <input name="lastName" onChange={handleChange} required />
            </div>
          </div>

          {/* Mobile + Email */}
          <div className="form-grid two">
            <div>
              <label>Mobile Number *</label>
              <input
                name="phone"
                placeholder="Enter 10-digit mobile number"
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                placeholder="example@gmail.com"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* System Info */}
          <h4 className="section-title">System Information</h4>

          <div className="form-grid two">
            <div className="password-field">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                required
              />
              <span className="eye">👁</span>
            </div>

            <div className="password-field">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                onChange={handleChange}
                required
              />
              <span className="eye">👁</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="button-row">
            <button type="submit" className="primary-btn">
              Register Account
            </button>
            <button type="button" className="secondary-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registration;
