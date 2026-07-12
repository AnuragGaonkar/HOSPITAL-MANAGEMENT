const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  fullName: String,
  dob: Date,
  age: Number,
  gender: String,
  weight: Number,
  height: Number,
  contactNumber: String,
  email: String,
  address: String,
  emergencyContactName: String,
  emergencyContactRelation: String,
  emergencyContactNumber: String,
  allergies: String,
  medications: String,
  pastSurgeries: String,
  chronicConditions: String,
  familyHistory: String,
  insuranceProvider: String,
  policyNumber: String,
  groupNumber: String,
  insuranceContact: String,
  preferredDoctor: String,
  reasonForRegistration: String,
  additionalComments: String,
  aadhaarCardNumber: {
    type: String,
    required: true,  // Ensure this is set to true
  },
  profilePhoto: String,
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Patient', patientSchema);
