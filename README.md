# StudyNook Backend – Library Study Room Booking API

Live API: https://your-backend-url.com

---

## Project Overview

StudyNook Backend is a RESTful API built for the StudyNook full-stack application.  
It handles authentication, room management, and a full booking system with conflict detection.

The system uses JWT authentication (HTTP-only cookies) and MongoDB as the database.

---

## Key Features

- Secure authentication using JWT (HTTP-only cookies / Better Auth compatible)
- Role-based access control (room owner vs normal user)
- Create, update, delete study rooms
- Get all rooms with search and filtering support
- Booking system with real-time time conflict detection
- My Rooms (user-specific listings)
- My Bookings (user-specific bookings)
- Booking cancel system with status update
- Booking count tracking per room
- Protected API routes using middleware
- MongoDB aggregation and query filters

---

## Tech Stack

- Node.js
- Express.js
- MongoDB (Native Driver)
- JWT (JOSE / Better Auth compatible)
- Cookie Parser
- CORS
- Dotenv

---

## Project Structure

- server.js (main entry)
- middleware/
  - verifyToken.js
- routes/
  - rooms routes
  - bookings routes
  - auth routes (if used)
- config/
  - database config

---

## Authentication System

- JWT generated on login
- Token stored in HTTP-only cookie
- Middleware verifies token from cookies
- User info attached to req.user
- Protected routes require valid token

---

## API Endpoints

### Auth
- POST /login
- POST /register (optional depending on setup)

---

### Rooms
- GET /rooms (public + search/filter)
- GET /rooms/:id
- POST /add-room (protected)
- GET /my-rooms (protected)
- PATCH /update-room/:id (owner only)
- DELETE /rooms/:id (owner only)

---

### Bookings
- POST /bookings (protected + conflict check)
- GET /bookings (protected)
- GET /my-bookings (protected)
- PATCH /bookings/:id/cancel (protected)

---

## Room Features

- Room name
- Description
- Image URL
- Floor
- Capacity
- Hourly rate
- Amenities (array)

---

## Booking System

- Users can book a room with date & time slots
- System prevents overlapping bookings using conflict detection
- Booking includes:
  - Date
  - Start time
  - End time
  - Total cost
  - Special note (optional)
- Booking count auto-increments on booking

---

## Security Features

- JWT verification middleware
- HTTP-only cookies
- Protected routes
- Owner validation before update/delete
- Input validation for ObjectId
- Error handling with proper HTTP status codes

---

## Search & Filtering

Supports:
- Search by room name (regex)
- Filter by amenities (array match)
- Filter by hourly rate range (gte/lte)

---

## Environment Variables

Create a `.env` file:
