# Kayak Distributed Travel System

A distributed Kayak-like travel booking system built with **React**, **Node.js**, **Express**, **MongoDB**, **MySQL**, **Redis**, and **Kafka**. Features AI-powered recommendations, real-time booking, and a modern dark-themed UI.

![Kayak Clone](https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800)

## 🚀 Features

### User Features
- **Authentication**: Register, Login (User & Admin)
- **Search**: Flights, Hotels, Cars with filters
- **Booking**: 3-step inline booking flow with payment
- **Reviews**: Rate and review bookings
- **Profile**: View/edit profile, booking history, payment history

### Admin Features
- **Dashboard**: Analytics, revenue stats
- **User Management**: View/manage users
- **Listings**: Manage flights, hotels, cars

### Technical Features
- **Microservices Architecture**: 7 independent services
- **Redux State Management**: With redux-persist
- **Real-time Updates**: Kafka event streaming
- **Caching**: Redis for performance
- **Dual Database**: MongoDB + MySQL

---

## 📁 Project Structure

```
gp2/
├── kayak-frontend/                 # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Route pages
│   │   ├── services/              # API service layer
│   │   ├── store/                 # Redux store
│   │   └── stores/                # Auth store (Redux wrapper)
│   └── package.json
│
└── kayak-distributed-travel-system-main/
    └── backend/
        ├── api-gateway/           # API Gateway (Port 5050)
        └── services/
            ├── user-service/      # User auth & profiles (Port 5001)
            ├── flights-service/   # Flight listings (Port 5002)
            ├── hotels-service/    # Hotel listings (Port 5003)
            ├── cars-service/      # Car rentals (Port 5004)
            ├── billing-service/   # Bookings & payments (Port 5005)
            ├── admin-service/     # Admin operations (Port 5006)
            └── reviews-service/   # Reviews & ratings (Port 5007)
```

---

## 🛠️ Prerequisites

Before running the application, ensure you have:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **MongoDB** v6+ ([Download](https://www.mongodb.com/try/download/community))
- **MySQL** v8+ ([Download](https://dev.mysql.com/downloads/))
- **Redis** (optional, for caching)
- **Kafka** (optional, for event streaming)

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/aneessaheba/kayak-distributed-travel-system.git
cd kayak-distributed-travel-system
```

### 2. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or run directly
mongod --dbpath /path/to/data/db
```

Verify MongoDB is running:
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

### 3. Start MySQL

```bash
# macOS (Homebrew)
brew services start mysql

# Login and create database
mysql -u root -p
```

```sql
-- User Service Database
CREATE DATABASE IF NOT EXISTS kayak_users;
USE kayak_users;

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(11) PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone_number VARCHAR(20),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Billing Service Database
CREATE DATABASE IF NOT EXISTS kayak_billing;
USE kayak_billing;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
  listing_id VARCHAR(50) NOT NULL,
  travel_date DATE NOT NULL,
  return_date DATE,
  quantity INT DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  billing_id VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  booking_id VARCHAR(50) NOT NULL,
  booking_type ENUM('flight', 'hotel', 'car') NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
```

### 4. Install Dependencies

```bash
# Install all backend dependencies
cd kayak-distributed-travel-system-main/backend

# API Gateway
cd api-gateway && npm install && cd ..

# Services
cd services/user-service && npm install && cd ../..
cd services/flights-service && npm install && cd ../..
cd services/hotels-service && npm install && cd ../..
cd services/cars-service && npm install && cd ../..
cd services/billing-service && npm install && cd ../..
cd services/admin-service && npm install && cd ../..
cd services/reviews-service && npm install && cd ../..

# Frontend
cd ../../../kayak-frontend && npm install
```

### 5. Seed the Database

```bash
# Seed flights, hotels, cars data
cd kayak-distributed-travel-system-main/backend
node scripts/seed-flights.js
node scripts/seed-hotels.js
node scripts/seed-cars.js
```

Or create sample data manually via the API.

### 6. Start All Services

Open **8 terminal windows** and run each service:

**Terminal 1 - API Gateway:**
```bash
cd kayak-distributed-travel-system-main/backend/api-gateway
PORT=5050 node src/server.js
```

**Terminal 2 - User Service:**
```bash
cd kayak-distributed-travel-system-main/backend/services/user-service
DB_HOST=localhost DB_USER=root DB_PASSWORD=yourpassword DB_NAME=kayak_users PORT=5001 node src/server.js
```
> Replace `yourpassword` with your MySQL root password

**Terminal 3 - Flights Service:**
```bash
cd kayak-distributed-travel-system-main/backend/services/flights-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_flights PORT=5002 node src/app.js
```

**Terminal 4 - Hotels Service:**
```bash
cd kayak-distributed-travel-system-main/backend/services/hotels-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_hotels PORT=5003 node src/app.js
```

**Terminal 5 - Cars Service:**
```bash
cd kayak-distributed-travel-system-main/backend/services/cars-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_cars PORT=5004 node src/app.js
```

**Terminal 6 - Billing Service:**
```bash
cd kayak-distributed-travel-system-main/backend/services/billing-service
MYSQL_HOST=localhost MYSQL_USER=root MYSQL_PASSWORD=yourpassword MYSQL_DATABASE=kayak_billing PORT=5005 node src/app.js
```

**Terminal 7 - Admin Service:**
```bash
cd kayak-distributed-travel-system-main/backend/services/admin-service
MONGO_URI=mongodb://127.0.0.1:27017/kayak_admin PORT=5006 node src/app.js
```

**Terminal 8 - Reviews Service:**
```bash
cd kayak-distributed-travel-system-main/backend/services/reviews-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_reviews PORT=5007 node src/server.js
```

**Terminal 9 - Frontend:**
```bash
cd kayak-frontend
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:5050

---

## 🔐 Test Accounts

### User Account
Create a new user via Register page, or use existing:
- Email: `jake@gmail.com`
- Password: `qwerty@10`

### Admin Account
- Email: `admin@kayak.com`
- Password: `admin123`

---

## 📡 API Endpoints

### User Service (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create user |
| POST | `/login` | User login |
| GET | `/` | Get all users |
| GET | `/:user_id` | Get user by ID |
| PUT | `/:user_id` | Update user |

### Flights Service (`/api/flights`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all flights |
| GET | `/:flight_id` | Get flight by ID |
| POST | `/` | Create flight (admin) |

### Hotels Service (`/api/hotels`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all hotels |
| GET | `/:hotel_id` | Get hotel by ID |
| POST | `/` | Create hotel (admin) |

### Cars Service (`/api/cars`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all cars |
| GET | `/:car_id` | Get car by ID |
| POST | `/` | Create car (admin) |

### Billing Service (`/api/billing`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create booking |
| GET | `/bookings/user/:user_id` | Get user bookings |
| POST | `/payments` | Process payment |
| GET | `/payments/user/:user_id` | Get payment history |

### Reviews Service (`/api/reviews`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:entity_type/:entity_id` | Get reviews |
| POST | `/` | Create review |
| GET | `/stats/:entity_type/:entity_id` | Get review stats |

### Admin Service (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Admin login |
| GET | `/analytics/overview` | Dashboard stats |
| GET | `/users` | Get all users |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                   React + Vite + Redux                       │
│                    (localhost:5173)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                Express + http-proxy-middleware               │
│                    (localhost:5050)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ User Service  │ │Flight Service │ │ Hotel Service │
│   (5001)      │ │   (5002)      │ │   (5003)      │
│   MongoDB     │ │   MongoDB     │ │   MongoDB     │
└───────────────┘ └───────────────┘ └───────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Car Service  │ │Billing Service│ │ Admin Service │
│   (5004)      │ │   (5005)      │ │   (5006)      │
│   MongoDB     │ │    MySQL      │ │ MongoDB+MySQL │
└───────────────┘ └───────────────┘ └───────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │Reviews Service│
                  │   (5007)      │
                  │   MongoDB     │
                  └───────────────┘
```

---

## 🎨 Screenshots

### Home Page
- Dark themed UI with search functionality
- Flights, Hotels, Cars tabs
- Featured deals section

### Booking Flow
1. Select listing → View Details
2. Choose dates/options → Continue to Payment
3. Enter payment info → Confirm & Pay
4. Booking confirmation with ID

### Profile Page
- Personal info tab
- Booking history tab
- Payment history tab

---

## 🔧 Environment Variables

Create `.env` files in each service directory:

### API Gateway
```env
PORT=5050
```

### User Service
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_users
JWT_SECRET=your-secret-key
```

### Billing Service
```env
PORT=5005
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=kayak_billing
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Ensure MongoDB is running
mongosh --eval "db.runCommand({ ping: 1 })"

# Use 127.0.0.1 instead of localhost
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_users
```

### Port Already in Use
```bash
# Find and kill process on port
lsof -i :5050
kill -9 <PID>
```

### MySQL Access Denied
```bash
# Reset MySQL password
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;
```

### Frontend Not Loading
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## 👥 Team

- **Frontend**: Anish
- **Backend**: [Your friend's name]

---

## 📄 License

This project is for educational purposes as part of a distributed systems course.

---

## 🔗 Links

- [GitHub Repository](https://github.com/aneessaheba/kayak-distributed-travel-system)
- [Project Requirements](./Group%20Project-%20Kayak.pdf)

