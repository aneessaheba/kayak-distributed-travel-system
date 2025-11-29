const { v4: uuidv4 } = require('uuid');

// Generate flight ID (e.g., FL-AA-a1b2c3)
const generateFlightId = (airline = 'FL') => {
  const prefix = airline.substring(0, 2).toUpperCase();
  const unique = uuidv4().substring(0, 8);
  return `${prefix}-${unique}`;
};

// Generate booking ID
const generateBookingId = () => {
  const unique = uuidv4().substring(0, 8);
  return `BK-FLT-${unique}`;
};

module.exports = {
  generateFlightId,
  generateBookingId
};
