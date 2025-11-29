# 🚀 Quick Setup Guide

Follow these steps to run the Kayak Distributed Travel System locally.

---

## Prerequisites

Make sure you have installed:
- **Node.js** v18+ → [Download](https://nodejs.org/)
- **MongoDB** → [Download](https://www.mongodb.com/try/download/community)
- **MySQL** → [Download](https://dev.mysql.com/downloads/)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/aneessaheba/kayak-distributed-travel-system.git
cd kayak-distributed-travel-system
git checkout frontend-integration
```

---

## Step 2: Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or run directly
mongod --dbpath /usr/local/var/mongodb
```

**Verify MongoDB is running:**
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

---

## Step 3: Start MySQL & Create Databases

```bash
# macOS (Homebrew)
brew services start mysql

# Login to MySQL
mysql -u root -p
```

**Run these SQL commands:**
```sql
-- Create User Service Database
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

-- Create Billing Service Database
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

EXIT;
```

---

## Step 4: Install Dependencies

Run these commands one by one:

```bash
# API Gateway
cd kayak-distributed-travel-system-main/backend/api-gateway
npm install

# User Service
cd ../services/user-service
npm install

# Flights Service
cd ../flights-service
npm install

# Hotels Service
cd ../hotels-service
npm install

# Cars Service
cd ../cars-service
npm install

# Billing Service
cd ../billing-service
npm install

# Admin Service
cd ../admin-service
npm install

# Reviews Service
cd ../reviews-service
npm install

# Frontend
cd ../../../../kayak-frontend
npm install
```

**Or run this single command (copy-paste friendly):**
```bash
cd kayak-distributed-travel-system-main/backend/api-gateway && npm install && \
cd ../services/user-service && npm install && \
cd ../flights-service && npm install && \
cd ../hotels-service && npm install && \
cd ../cars-service && npm install && \
cd ../billing-service && npm install && \
cd ../admin-service && npm install && \
cd ../reviews-service && npm install && \
cd ../../../../kayak-frontend && npm install
```

---

## Step 5: Start All Services

**Open 9 terminal windows/tabs and run each command:**

### Terminal 1 - API Gateway (Port 5050)
```bash
cd kayak-distributed-travel-system-main/backend/api-gateway
PORT=5050 node src/server.js
```

### Terminal 2 - User Service (Port 5001)
```bash
cd kayak-distributed-travel-system-main/backend/services/user-service
DB_HOST=localhost DB_USER=root DB_PASSWORD=YOUR_PASSWORD DB_NAME=kayak_users PORT=5001 node src/server.js
```
> ⚠️ Replace `YOUR_PASSWORD` with your MySQL root password

### Terminal 3 - Flights Service (Port 5002)
```bash
cd kayak-distributed-travel-system-main/backend/services/flights-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_flights PORT=5002 node src/app.js
```

### Terminal 4 - Hotels Service (Port 5003)
```bash
cd kayak-distributed-travel-system-main/backend/services/hotels-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_hotels PORT=5003 node src/app.js
```

### Terminal 5 - Cars Service (Port 5004)
```bash
cd kayak-distributed-travel-system-main/backend/services/cars-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_cars PORT=5004 node src/app.js
```

### Terminal 6 - Billing Service (Port 5005)
```bash
cd kayak-distributed-travel-system-main/backend/services/billing-service
MYSQL_HOST=localhost MYSQL_USER=root MYSQL_PASSWORD=YOUR_PASSWORD MYSQL_DATABASE=kayak_billing PORT=5005 node src/app.js
```
> ⚠️ Replace `YOUR_PASSWORD` with your MySQL root password

### Terminal 7 - Admin Service (Port 5006)
```bash
cd kayak-distributed-travel-system-main/backend/services/admin-service
MONGO_URI=mongodb://127.0.0.1:27017/kayak_admin PORT=5006 node src/app.js
```

### Terminal 8 - Reviews Service (Port 5007)
```bash
cd kayak-distributed-travel-system-main/backend/services/reviews-service
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_reviews PORT=5007 node src/server.js
```

### Terminal 9 - Frontend (Port 5173)
```bash
cd kayak-frontend
npm run dev
```

---

## Step 6: Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **API Gateway** | http://localhost:5050 |

---

## Test Accounts

### User Login
```
Email: jake@gmail.com
Password: qwerty@10
```

### Admin Login
```
Email: admin@kayak.com
Password: admin123
```

Or register a new user on the Sign Up page.

---

## Seed Sample Data (Optional)

To add sample flights, hotels, and cars:

```bash
cd kayak-distributed-travel-system-main/backend

# If seed scripts exist
node scripts/seed-flights.js
node scripts/seed-hotels.js
node scripts/seed-cars.js
```

---

## Troubleshooting

### MongoDB Connection Error
```bash
# Use 127.0.0.1 instead of localhost
MONGODB_URI=mongodb://127.0.0.1:27017/kayak_users
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5050

# Kill it
kill -9 <PID>
```

### MySQL Access Denied
```bash
# Check your password is correct
mysql -u root -p

# Or reset password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
```

### Frontend Blank Page
```bash
# Clear cache and restart
cd kayak-frontend
rm -rf node_modules/.vite
npm run dev
```

---

## Service Ports Reference

| Service | Port |
|---------|------|
| Frontend | 5173 |
| API Gateway | 5050 |
| User Service | 5001 |
| Flights Service | 5002 |
| Hotels Service | 5003 |
| Cars Service | 5004 |
| Billing Service | 5005 |
| Admin Service | 5006 |
| Reviews Service | 5007 |

---

## Need Help?

Contact the team:
- Frontend: Anish
- Backend: [Team member names]

