require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospital');
const bookingRoutes = require('./routes/booking');
const patientRoutes = require('./routes/patient');
const passwordResetRoutes = require('./routes/passwordReset');
const emergencyRoutes = require('./routes/emergency');
const publicRoutes = require('./routes/public');
const cors = require('cors');
const path = require('path'); // Ensure path module is imported
const fs = require('fs');

const app = express();

// Connect to MongoDB
connectDB();

// Multer's diskStorage doesn't create destination folders on its own —
// make sure this exists before any upload hits it, or the first
// request would crash with ENOENT.
fs.mkdirSync(path.join(__dirname, 'uploads', 'photos'), { recursive: true });

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
app.use('/', passwordResetRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/public', publicRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));