import React, { useState } from 'react';
import './PatientRegistration.css';
import Navbar from '../Navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function PatientRegistration() {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactNumber: '',
    allergies: '',
    medications: '',
    pastSurgeries: '',
    chronicConditions: '',
    familyHistory: '',
    insuranceProvider: '',
    policyNumber: '',
    groupNumber: '',
    insuranceContact: '',
    preferredDoctor: '',
    reasonForRegistration: '',
    additionalComments: '',
    aadhaarCardNumber: '',
    profilePhoto: null,
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    contactNumber: '',
    emergencyContactNumber: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Update form data
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });

    // Validate specific fields
    if (name === 'contactNumber' || name === 'emergencyContactNumber') {
      if (value.length !== 10) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: 'Phone number must be 10 digits long.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: '',
        }));
      }
    }

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: 'Passwords do not match.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: '',
        }));
      }
    }

    if (name === 'dob') {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      setFormData((prevData) => ({
        ...prevData,
        age: age,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Frontend validations
    if (
      formData.contactNumber.length !== 10 ||
      formData.emergencyContactNumber.length !== 10 ||
      formData.password.length < 6 ||
      formData.password !== formData.confirmPassword
    ) {
      setErrors({
        contactNumber:
          formData.contactNumber.length !== 10
            ? 'Phone number must be 10 digits long.'
            : '',
        emergencyContactNumber:
          formData.emergencyContactNumber.length !== 10
            ? 'Phone number must be 10 digits long.'
            : '',
        password:
          formData.password.length < 6
            ? 'Password must be at least 6 characters long.'
            : '',
        confirmPassword:
          formData.password !== formData.confirmPassword
            ? 'Passwords do not match.'
            : '',
      });
      return;
    }
  
    // Create FormData object
    const formDataWithFile = new FormData();
  
    // Append form fields
    for (const key in formData) {
      if (key !== 'profilePhoto') {
        formDataWithFile.append(key, formData[key]);
      }
    }
  
    // Append the file if it exists
    if (formData.profilePhoto) {
      formDataWithFile.append('profilePhoto', formData.profilePhoto);
    }
  
    // Log form data and file
    console.log('Form data being sent:', formDataWithFile);
  
    try {
      const response = await axios.post(
        'http://localhost:5000/register/patient',
        formDataWithFile,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log(response);
      alert('Registration successful! You can now log in.');
      navigate('/login/patient');
    } catch (error) {
      console.error('Error submitting form data:', error);
      const errorMessage =
        error.response?.data?.message || 'Registration failed.';
      alert(errorMessage);
    }
  };
  
  

  return (
    <>
      <Navbar />
      <div className="registration-container">
        <div className="registration-toggle">
          <button
            onClick={() => navigate('/login/patient')}
            className="login-button"
          >
            Login
          </button>
          <button className="register-button active">Register</button>
        </div>
        <div className="registration-form">
          <h2>Patient Registration</h2>
          <form onSubmit={handleSubmit}>
            {/* Form Fields */}
            <section>
              <h3>Personal Information</h3>
              <label>
                Full Name:*
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Date of Birth:*
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Gender:*
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Weight (kg):*
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Height (cm):*
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Contact Number:*
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                />
                {errors.contactNumber && (
                  <span className="error-message">{errors.contactNumber}</span>
                )}
              </label>
              <label>
                Email Address:*
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Aadhaar Card Number:*
                <input
                  type="text"
                  name="aadhaarCardNumber"
                  value={formData.aadhaarCardNumber}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Address:*
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Profile Photo:
                <input
                  type="file"
                  name="profilePhoto"
                  onChange={handleChange}
                  accept="image/*"
                />
              </label>
              <label>
                Emergency Contact Name:*
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Emergency Contact Relationship:*
                <input
                  type="text"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Emergency Contact Number:*
                <input
                  type="tel"
                  name="emergencyContactNumber"
                  value={formData.emergencyContactNumber}
                  onChange={handleChange}
                  required
                />
                {errors.emergencyContactNumber && (
                  <span className="error-message">
                    {errors.emergencyContactNumber}
                  </span>
                )}
              </label>
              <label>
                Password:*
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </label>
              <label>
                Confirm Password:*
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && (
                  <span className="error-message">
                    {errors.confirmPassword}
                  </span>
                )}
              </label>
            </section>

            {/* Medical History Section */}
            <section>
              <h3>Medical History</h3>
              <label>
                Allergies:
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                />
              </label>
              <label>
                Current Medications:
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                />
              </label>
              <label>
                Past Surgeries:
                <textarea
                  name="pastSurgeries"
                  value={formData.pastSurgeries}
                  onChange={handleChange}
                />
              </label>
              <label>
                Chronic Conditions:
                <textarea
                  name="chronicConditions"
                  value={formData.chronicConditions}
                  onChange={handleChange}
                />
              </label>
              <label>
                Family History:
                <textarea
                  name="familyHistory"
                  value={formData.familyHistory}
                  onChange={handleChange}
                />
              </label>
            </section>

            {/* Insurance Information */}
            <section>
              <h3>Insurance Information</h3>
              <label>
                Insurance Provider:
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                />
              </label>
              <label>
                Policy Number:
                <input
                  type="text"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleChange}
                />
              </label>
              <label>
                Group Number:
                <input
                  type="text"
                  name="groupNumber"
                  value={formData.groupNumber}
                  onChange={handleChange}
                />
              </label>
              <label>
                Insurance Contact:
                <input
                  type="text"
                  name="insuranceContact"
                  value={formData.insuranceContact}
                  onChange={handleChange}
                />
              </label>
            </section>

            {/* Additional Information */}
            <section>
              <h3>Additional Information</h3>
              <label>
                Preferred Doctor:
                <input
                  type="text"
                  name="preferredDoctor"
                  value={formData.preferredDoctor}
                  onChange={handleChange}
                />
              </label>
              <label>
                Reason for Registration:
                <textarea
                  name="reasonForRegistration"
                  value={formData.reasonForRegistration}
                  onChange={handleChange}
                />
              </label>
              <label>
                Additional Comments:
                <textarea
                  name="additionalComments"
                  value={formData.additionalComments}
                  onChange={handleChange}
                />
              </label>
            </section>

            {/* Submit Button */}
            <button type="submit">Submit Registration</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default PatientRegistration;
