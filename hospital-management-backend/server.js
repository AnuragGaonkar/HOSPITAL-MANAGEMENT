require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospital');
const bookingRoutes = require('./routes/booking');
const patientRoutes = require('./routes/patient');
const cors = require('cors');
const path = require('path'); // Ensure path module is imported

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/', authRoutes);
app.use('/hospital', hospitalRoutes);
app.use('/', bookingRoutes);
app.use('/patient', patientRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));