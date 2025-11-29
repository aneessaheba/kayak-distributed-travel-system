# Hotels Service

Hotels microservice for Kayak travel booking simulation.

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
PORT=3008
MONGODB_URI=mongodb://localhost:27017/kayak_hotels
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
| GET | /api/hotels | Get all hotels (with filters) |
| GET | /api/hotels/:id | Get hotel by ID |
| GET | /api/hotels/:id/availability | Check room availability |
| GET | /api/hotels/:id/reviews | Get hotel reviews |

### User Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/hotels/:id/book | Book a room |
| POST | /api/hotels/:id/reviews | Add a review |

### Admin Routes (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/hotels | Create hotel |
| PUT | /api/hotels/:id | Update hotel |
| DELETE | /api/hotels/:id | Delete hotel |
| POST | /api/hotels/:id/upload-image | Upload single image |
| POST | /api/hotels/:id/upload-images | Upload multiple images (max 10) |
| POST | /api/hotels/:id/add-image-url | Add image by URL |
| DELETE | /api/hotels/:id/images/:index | Delete image by index |

## Filter Options

| Parameter | Description | Example |
|-----------|-------------|---------|
| city | Filter by city | `?city=San Jose` |
| state | Filter by state | `?state=CA` |
| star_rating | Minimum star rating | `?star_rating=4` |
| min_price | Minimum price per night | `?min_price=100` |
| max_price | Maximum price per night | `?max_price=300` |
| amenities | Required amenities (comma separated) | `?amenities=WiFi,Pool` |
| room_type | Filter by room type | `?room_type=Suite` |
| page | Page number | `?page=1` |
| limit | Results per page | `?limit=10` |

## Room Types

- Single
- Double
- Suite
- Deluxe
- Family
- Presidential

## Sample Requests

### Create Hotel (Admin)

```bash
POST /api/hotels
Authorization: Bearer <admin-token>

{
  "hotel_name": "Grand Hyatt",
  "address": "123 Main Street",
  "city": "San Jose",
  "state": "CA",
  "zip_code": "95112",
  "star_rating": 5,
  "room_types": [
    {
      "type": "Single",
      "price_per_night": 150,
      "total_rooms": 50,
      "amenities": ["WiFi", "TV", "Mini Bar"]
    },
    {
      "type": "Double",
      "price_per_night": 200,
      "total_rooms": 40,
      "amenities": ["WiFi", "TV", "Mini Bar", "Balcony"]
    },
    {
      "type": "Suite",
      "price_per_night": 350,
      "total_rooms": 10,
      "amenities": ["WiFi", "TV", "Mini Bar", "Balcony", "Jacuzzi"]
    }
  ],
  "amenities": ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Parking"]
}
```

### Book Hotel Room

```bash
POST /api/hotels/HTL-xxxxxxxx/book

{
  "user_id": "123-45-6789",
  "room_type": "Double",
  "check_in_date": "2025-12-25",
  "check_out_date": "2025-12-28",
  "rooms": 1,
  "payment_method": "credit_card"
}
```

### Add Review

```bash
POST /api/hotels/HTL-xxxxxxxx/reviews

{
  "user_id": "123-45-6789",
  "rating": 5,
  "comment": "Amazing hotel, great service!"
}
```

### Upload Image (Admin)

```bash
POST /api/hotels/HTL-xxxxxxxx/upload-image
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

image: <file>
caption: "Hotel Lobby"
```

### Add Image URL (Admin)

```bash
POST /api/hotels/HTL-xxxxxxxx/add-image-url
Authorization: Bearer <admin-token>

{
  "url": "https://example.com/hotel-image.jpg",
  "caption": "Pool Area"
}
```

## Kafka Topics

- **Publishes to:** `booking.created`
- **Consumes from:** `payment.processed`

## Folder Structure

```
hotels-service/
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
    │   └── hotelModel.js
    ├── controllers/
    │   └── hotelController.js
    ├── routes/
    │   └── hotelRoutes.js
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
