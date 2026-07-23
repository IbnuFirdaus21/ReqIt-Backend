# Backend - MBG Web Application

This backend service powers the API layer for the MBG web application. It handles authentication, menu management, requests, ratings, feedback, allergy summaries, and chatbot responses.

## What this backend provides

- Express.js REST API server
- MySQL database integration
- User registration and login with JWT authentication
- Menu CRUD endpoints for daily menu management
- Request submission and summary endpoints
- Rating and feedback endpoints
- Allergy processing and summary routes
- Chatbot integration with OpenRouter AI

## Main technology stack

- Node.js
- Express.js
- MySQL
- bcryptjs for password hashing
- jsonwebtoken for authentication
- multer for file uploads
- dotenv for environment variables
- cors for cross-origin requests

## Project structure

- index.js: main server entry point and API routes
- normalization/: menu and allergy normalization pipeline logic
- uploads/: uploaded menu images
- data/: sample datasets used by the normalization pipeline

## Prerequisites

- Node.js 18 or newer
- npm
- MySQL database running locally or remotely
- An OpenRouter API key if you want chatbot responses to work

## Setup

1. Change into the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with the required values:
   ```bash
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=mbg_db
   JWT_SECRET=your-secret-key
   OPENROUTER_API_KEY=your-openrouter-key
   ```
4. Start the server:
   ```bash
   npm start
   ```

The backend will run on http://localhost:8800.

## Main API endpoints

### Authentication

- POST /api/auth/register
- POST /api/auth/login

### Menus

- GET /api/menus
- GET /api/menus/today
- POST /api/menus

### Requests

- GET /api/requests
- POST /api/requests
- GET /api/requests/summary

### Ratings and feedback

- GET /api/ratings
- POST /api/ratings
- GET /api/feedbacks
- POST /api/feedbacks

### Allergies and chatbot

- GET /api/allergies/summary
- POST /api/chatbot

## Notes

- The backend expects a MySQL schema that includes tables such as users, menus, requests, ratings, feedbacks, and students_data.
- Uploaded menu images are stored in the uploads folder.
- The normalization pipeline is used to clean and validate menu inputs and allergy details.
