const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();

// Increase JSON pay load limit to support base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS
app.use(cors({
  origin: '*', // In development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API Routes
app.use('/api', routes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Device Distribution Management System API is running...' });
});

// Port and MongoDB setup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/device-distribution';

const maskedUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
console.log(`Connecting to MongoDB Atlas: ${maskedUri}`);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed.');
    console.error(err);
    process.exit(1);
  });
