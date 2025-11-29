const { kafka } = require('../config/kafka');
const Hotel = require('../models/hotelModel');
const { deleteCache, clearCachePattern } = require('../config/redis');

const consumer = kafka.consumer({ groupId: 'hotels-service-group' });

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
        
        // Only process hotel bookings
        if (event.booking_type === 'hotel') {
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
    const { booking_id, listing_id, status } = event;

    console.log('🏨 Processing hotel payment event:', booking_id);

    const hotel = await Hotel.findOne({ hotel_id: listing_id });

    if (!hotel) {
      console.error('❌ Hotel not found:', listing_id);
      return;
    }

    // Find booking
    const booking = hotel.bookings.find(b => b.booking_id === booking_id);

    if (!booking) {
      console.error('❌ Booking not found:', booking_id);
      return;
    }

    if (status === 'completed') {
      // Payment successful - confirm booking
      booking.status = 'confirmed';
      console.log('✅ Hotel booking confirmed:', booking_id);
    } else {
      // Payment failed - cancel booking
      booking.status = 'cancelled';
      console.log('❌ Hotel booking cancelled:', booking_id);
    }

    await hotel.save();

    // Clear cache
    await deleteCache(`hotels:${listing_id}`);
    await clearCachePattern('hotels:list:*');

    console.log('✅ Hotel booking updated for:', listing_id);

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
