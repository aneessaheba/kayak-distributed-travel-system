# Flights Service

Flights microservice for Kayak travel booking simulation.

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** MongoDB
- **Cache:** Redis
- **Messaging:** Apache Kafka
- **Auth:** JWT (Admin routes)

## Prerequisites

- Node.js 18+
- Docker (for MongoDB, Redis, Kafka)
- MongoDB running on port 27017
- Redis running on port 6380
- Kafka running on port 9092

## Setup

### 1. Start Docker containers

```bash
docker-compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create `.env` file:

```env
PORT=3007
MONGODB_URI=mongodb://localhost:27017/kayak_flights
KAFKA_BROKER=localhost:9092
REDIS_HOST=localhost
REDIS_PORT=6380
JWT_SECRET=secret
```

### 4. Run the service

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Public Routes (No auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/flights | Get all flights (with filters) |
| GET | /api/flights/:id | Get flight by ID |
| GET | /api/flights/:id/availability | Check seat availability |
| GET | /api/flights/:id/reviews | Get flight reviews |

### User Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/flights/:id/book | Book a flight |
| POST | /api/flights/:id/reviews | Add a review |

### Admin Routes (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/flights | Create flight |
| PUT | /api/flights/:id | Update flight |
| DELETE | /api/flights/:id | Delete flight |
| POST | /api/flights/:id/upload-image | Upload image |

## Filter Options

| Parameter | Description | Example |
|-----------|-------------|---------|
| airline | Filter by airline | `?airline=American` |
| departure_airport | Departure airport code | `?departure_airport=SFO` |
| arrival_airport | Arrival airport code | `?arrival_airport=LAX` |
| flight_class | Economy/Business/First | `?flight_class=Economy` |
| min_price | Minimum price | `?min_price=100` |
| max_price | Maximum price | `?max_price=500` |
| departure_date | Filter by date | `?departure_date=2025-12-25` |
| page | Page number | `?page=1` |
| limit | Results per page | `?limit=10` |

## Sample Requests

### Create Flight (Admin)

```bash
POST /api/flights
Authorization: Bearer <admin-token>

{
  "flight_id": "AA123",
  "airline": "American Airlines",
  "departure_airport": "SFO",
  "arrival_airport": "LAX",
  "departure_datetime": "2025-12-25T08:00:00Z",
  "arrival_datetime": "2025-12-25T09:30:00Z",
  "duration": 90,
  "flight_class": "Economy",
  "ticket_price": 150,
  "total_seats": 180
}
```

### Book Flight

```bash
POST /api/flights/AA123/book

{
  "user_id": "123-45-6789",
  "seats": 2,
  "payment_method": "credit_card"
}
```

### Add Review

```bash
POST /api/flights/AA123/reviews

{
  "user_id": "123-45-6789",
  "rating": 5,
  "comment": "Great flight!"
}
```

## Kafka Topics

- **Publishes to:** `booking.created`
- **Consumes from:** `payment.processed`

## Folder Structure

```
flights-service/
├── package.json
├── .env
├── uploads/
└── src/
    ├── config/
    │   ├── mongodb.js
    │   ├── kafka.js
    │   ├── redis.js
    │   └── upload.js
    ├── models/
    │   └── flightModel.js
    ├── controllers/
    │   └── flightController.js
    ├── routes/
    │   └── flightRoutes.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── consumers/
    │   └── paymentConsumer.js
    ├── utils/
    │   └── idGenerator.js
    └── index.js
```

## Team

- Kayak Simulation Project - Distributed Systems
