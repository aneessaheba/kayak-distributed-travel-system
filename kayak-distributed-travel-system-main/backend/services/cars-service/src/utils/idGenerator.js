const { v4: uuidv4 } = require('uuid');

// Generate Car ID (e.g., CAR-a1b2c3d4)
const generateCarId = () => {
  const uuid = uuidv4().split('-')[0];
  return `CAR-${uuid}`;
};

// Generate Booking ID (e.g., BK-CAR-a1b2c3d4)
const generateBookingId = () => {
  const uuid = uuidv4().split('-')[0];
  return `BK-CAR-${uuid}`;
};

// Generate Review ID (e.g., REV-a1b2c3d4)
const generateReviewId = () => {
  const uuid = uuidv4().split('-')[0];
  return `REV-${uuid}`;
};

module.exports = {
  generateCarId,
  generateBookingId,
  generateReviewId
};