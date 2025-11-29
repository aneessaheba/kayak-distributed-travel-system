const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectMongoDB, disconnectMongoDB } = require('./config/mongodb');
const { connectProducer, disconnectProducer } = require('./config/kafka');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { startConsumer, disconnectConsumer } = require('./consumers/paymentConsumer');
const carRoutes = require('./routes/carRoutes');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/cars', carRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'cars-service',
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Connect to Redis
    await connectRedis();

    // Connect Kafka producer
    await connectProducer();

    // Start Kafka consumer
    await startConsumer();

    app.listen(PORT, () => {
      console.log(`🚗 Cars Service running on port ${PORT}`);
      console.log(`📡 Listening for Kafka events...`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing connections...');
  await disconnectProducer();
  await disconnectConsumer();
  await disconnectRedis();
  await disconnectMongoDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing connections...');
  await disconnectProducer();
  await disconnectConsumer();
  await disconnectRedis();
  await disconnectMongoDB();
  process.exit(0);
});

module.exports = app;