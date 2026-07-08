const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const { globalErrorHandler, notFound } = require('./utils/errorHandler');
const dotenv = require('dotenv');
const routes = require('./routes/index');

dotenv.config();
const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration - Handle preflight and actual requests
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://64.227.133.212',
    'http://forpink.com',
    'https://forpink.com',
    'http://www.forpink.com',
    'https://www.forpink.com',
    'http://api.forpink.com',
    'https://api.forpink.com',
    'http://64.227.133.212:3000'
];

// Manual CORS middleware for better control
app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Always set these headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-CSRF-Token');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// Also use cors package as fallback
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1', routes);

app.get('/', (req, res) => {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Pinkspot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gradient-to-br from-pink-50 to-white h-screen w-full flex items-center justify-center m-0 font-sans">
    <div class="text-center p-10 bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-pink-100 transform transition-all duration-500 hover:scale-105 hover:shadow-pink-200/50">
        <div class="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-pink-100">
            <i class="fa-solid fa-bag-shopping text-4xl text-pink-500"></i>
        </div>
        <h1 class="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">Welcome to Pinkspot</h1>
        <p class="text-gray-500 mb-8 text-md font-medium">To visit our official website please click the button below.</p>
        <a href="https://www.pinkspot.bd" class="inline-flex items-center justify-center px-8 py-4 bg-pink-600 text-white font-semibold text-lg rounded-full shadow-lg hover:bg-pink-700 hover:shadow-pink-500/30 transition-all duration-300 w-full group">
            <span>Go to Site</span>
            <i class="fa-solid fa-arrow-right-long ml-3 group-hover:translate-x-2 transition-transform duration-300"></i>
        </a>
    </div>
</body>
</html>
    `;
    return res.status(200).send(htmlTemplate);
});


// 404 Route
app.use(notFound);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
