const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'flights-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  connectionTimeout: 3000,
  requestTimeout: 5000,
  retry: {
    initialRetryTime: 100,
    retries: 2
  }
});

const producer = kafka.producer();

let isConnected = false;

const connectProducer = async () => {
  try {
    console.log('Connecting to Kafka producer...');
    await producer.connect();
    console.log('✅ Kafka producer connected');
    isConnected = true;
  } catch (error) {
    console.error('❌ Kafka producer connection failed:', error.message);
    console.log('⚠️  Service will continue without Kafka');
    isConnected = false;
  }
};

const publishEvent = async (topic, message) => {
  if (!isConnected) {
    console.log('⚠️  Kafka not connected, skipping event publish');
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    console.log(`📤 Published to ${topic}`);
  } catch (error) {
    console.error('❌ Error publishing event:', error.message);
  }
};

const disconnectProducer = async () => {
  if (isConnected) {
    try {
      await producer.disconnect();
      console.log('Kafka producer disconnected');
    } catch (error) {
      console.error('Error disconnecting producer:', error.message);
    }
  }
};

module.exports = {
  kafka,
  connectProducer,
  publishEvent,
  disconnectProducer
};
