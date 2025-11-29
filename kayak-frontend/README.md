# Kayak Frontend - Travel Booking Platform

A modern, full-featured frontend for a Kayak-like travel metasearch and booking platform built with React, TypeScript, and Vite.

## 🚀 Features

### User Module
- **Search & Filter**: Search for flights, hotels, and cars with advanced filtering options
- **Booking Management**: View and manage past, current, and future bookings
- **User Profile**: Complete profile management with payment methods and preferences
- **Reviews**: Submit and view reviews for flights, hotels, and cars

### Admin Module
- **Dashboard**: Real-time analytics with revenue charts, booking statistics, and top destinations
- **Listings Management**: Add, edit, and manage flights, hotels, and car listings
- **User Management**: View and modify user accounts
- **Billing Reports**: Search and analyze bills by date and month

### AI Concierge
- **Natural Language Search**: Chat-based interface for finding travel deals
- **Personalized Recommendations**: AI-powered travel bundles with "Why this?" explanations
- **Price Alerts**: Real-time notifications for price drops and limited availability

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Zustand** for state management
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Lucide React** for icons
- **CSS Modules** for scoped styling

## 📦 Installation

```bash
# Navigate to the frontend directory
cd kayak-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Design System

The UI follows a dark theme with:
- **Primary Color**: Orange (#ff690f) - Kayak brand color
- **Accent Color**: Cyan (#00c6c6) - For AI/special features
- **Typography**: Outfit (display), DM Sans (body)
- **Glass morphism** effects for modern aesthetics

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Footer, Layout
│   └── ui/              # Reusable UI components (Button, Card, Input, etc.)
├── pages/
│   ├── admin/           # Admin dashboard and management pages
│   ├── user/            # User profile and bookings
│   ├── Home.tsx         # Landing page with search
│   ├── Flights.tsx      # Flight search and results
│   ├── Hotels.tsx       # Hotel search and results
│   ├── Cars.tsx         # Car rental search and results
│   ├── Concierge.tsx    # AI chat interface
│   ├── Login.tsx        # User login
│   └── Register.tsx     # User registration
├── stores/              # Zustand state stores
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🔗 API Integration

The frontend is designed to connect to a FastAPI backend with:
- REST APIs for CRUD operations
- WebSocket connections for real-time updates (AI Concierge, price alerts)
- Kafka integration for async event processing

## 📱 Responsive Design

Fully responsive design that works on:
- Desktop (1400px+)
- Tablet (768px - 1100px)
- Mobile (< 768px)

## 🔐 Authentication

- JWT-based authentication
- Protected routes for user and admin pages
- Role-based access control (User vs Admin)

## 📊 Performance

- Code splitting with React.lazy (can be added)
- Optimized images with lazy loading
- CSS Modules for minimal CSS bundle
- Vite's fast HMR for development

## 🚧 Future Improvements

- [ ] Add unit tests with Vitest
- [ ] Implement real API integration
- [ ] Add internationalization (i18n)
- [ ] Implement service worker for offline support
- [ ] Add more accessibility features (ARIA labels)

## 📄 License

This project is part of a Distributed Systems for Data Engineering course project.
