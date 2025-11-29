const { v4: uuidv4 } = require('uuid');

// Generate hotel ID (e.g., HTL-a1b2c3d4)
const generateHotelId = () => {
  const unique = uuidv4().substring(0, 8);
  return `HTL-${unique}`;
};

// Generate booking ID
const generateBookingId = () => {
  const unique = uuidv4().substring(0, 8);
  return `BK-HTL-${unique}`;
};

module.exports = {
  generateHotelId,
  generateBookingId
};
