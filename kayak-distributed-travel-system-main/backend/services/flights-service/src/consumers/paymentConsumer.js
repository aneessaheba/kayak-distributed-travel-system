const { kafka } = require('../config/kafka');
const Flight = require('../models/flightModel');
const { deleteCache, clearCachePattern } = require('../config/redis');

const consumer = kafka.consumer({ groupId: 'flights-service-group' });

let isConnected = false;

async function connectConsumer() {
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
}

async function startConsumer() {
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
        
        // Only process flight bookings
        if (event.booking_type === 'flight') {
          await handlePaymentProcessed(event);
        }
      } catch (error) {
        console.error('❌ Error processing message:', error.message);
      }
    }
  });
}

async function handlePaymentProcessed(event) {
  try {
    const { booking_id, listing_id, status, quantity } = event;

    console.log('✈️  Processing flight payment event:', booking_id);

    const flight = await Flight.findOne({ flight_id: listing_id });

    if (!flight) {
      console.error('❌ Flight not found:', listing_id);
      return;
    }

    // Find booking
    const booking = flight.bookings.find(b => b.booking_id === booking_id);

    if (!booking) {
      console.error('❌ Booking not found:', booking_id);
      return;
    }

    if (status === 'completed') {
      // Payment successful - confirm booking
      booking.status = 'confirmed';
      console.log('✅ Flight booking confirmed:', booking_id);
    } else {
      // Payment failed - cancel booking and restore seats
      booking.status = 'cancelled';
      flight.available_seats += booking.seats;
      console.log('❌ Flight booking cancelled:', booking_id);
    }

    await flight.save();

    // Clear cache
    await deleteCache(`flights:${listing_id}`);
    await clearCachePattern('flights:list:*');

    console.log('✅ Flight availability updated for:', listing_id);

  } catch (error) {
    console.error('❌ Error handling payment event:', error.message);
  }
}

async function disconnectConsumer() {
  if (isConnected) {
    try {
      await consumer.disconnect();
      console.log('Kafka consumer disconnected');
    } catch (error) {
      console.error('Error disconnecting consumer:', error.message);
    }
  }
}

module.exports = {
  startConsumer,
  disconnectConsumer
};
