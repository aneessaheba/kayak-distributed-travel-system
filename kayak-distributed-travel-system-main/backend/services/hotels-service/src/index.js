const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import configs
const connectMongoDB = require('./config/mongodb');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { connectProducer, disconnectProducer } = require('./config/kafka');
const { startConsumer, disconnectConsumer } = require('./consumers/paymentConsumer');

// Import routes
const hotelRoutes = require('./routes/hotelRoutes');

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/hotels', hotelRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'hotels-service',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Connect to Redis
    await connectRedis();

    // Connect to Kafka producer
    await connectProducer();

    // Start Kafka consumer
    await startConsumer();

    app.listen(PORT, () => {
      console.log(`🏨 Hotels Service running on port ${PORT}`);
      console.log(`📡 Listening for Kafka events...`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing connections...');
  await disconnectProducer();
  await disconnectConsumer();
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nSIGTERM signal received: closing connections...');
  await disconnectProducer();
  await disconnectConsumer();
  await disconnectRedis();
  process.exit(0);
});

startServer();
