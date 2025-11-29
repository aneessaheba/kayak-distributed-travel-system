const { kafka } = require('../config/kafka');
const Car = require('../models/carModel');
const { deleteCache, clearCachePattern } = require('../config/redis');

const consumer = kafka.consumer({
  groupId: 'cars-service-group'
});

let isConnected = false;

const connectConsumer = async () => {
  try {
    console.log('Connecting Kafka consumer...');
    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    await consumer.subscribe({
      topic: 'payment.processed',
      fromBeginning: false
    });

    console.log('✅ Subscribed to topic: payment.processed');
    isConnected = true;
  } catch (error) {
    console.error('❌ Kafka consumer connection failed:', error.message);
    console.log('⚠️  Consumer will not be available');
    isConnected = false;
  }
};

const startConsumer = async () => {
  await connectConsumer();

  if (!isConnected) {
    console.log('⚠️  Skipping consumer - Kafka not available');
    return;
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log('📥 Received event from topic:', topic);

        // Only process car bookings
        if (event.booking_type === 'car') {
          await handlePaymentProcessed(event);
        }
      } catch (error) {
        console.error('❌ Error processing message:', error.message);
      }
    }
  });
};

const handlePaymentProcessed = async (event) => {
  try {
    const {
      booking_id,
      listing_id,
      status,
      travel_date,
      return_date
    } = event;

    console.log('🚗 Processing car payment event:', booking_id);

    const car = await Car.findOne({ car_id: listing_id });

    if (!car) {
      console.error('❌ Car not found:', listing_id);
      return;
    }

    // Find the booking in car's bookings array
    const booking = car.bookings.find(b => b.booking_id === booking_id);

    if (!booking) {
      console.error('❌ Booking not found in car:', booking_id);
      return;
    }

    // Update booking status based on payment result
    if (status === 'completed') {
      booking.status = 'confirmed';
      console.log('✅ Car booking confirmed:', booking_id);
    } else if (status === 'failed') {
      booking.status = 'cancelled';
      console.log('❌ Car booking cancelled (payment failed):', booking_id);
    }

    await car.save();

    // Clear cache
    await deleteCache(`cars:${listing_id}`);
    await clearCachePattern('cars:list:*');

    console.log('✅ Car availability updated for:', listing_id);

  } catch (error) {
    console.error('❌ Error handling payment.processed:', error.message);
  }
};

const disconnectConsumer = async () => {
  if (isConnected) {
    try {
      await consumer.disconnect();
      console.log('Kafka consumer disconnected');
    } catch (error) {
      console.error('Error disconnecting consumer:', error.message);
    }
  }
};

module.exports = {
  startConsumer,
  disconnectConsumer
};