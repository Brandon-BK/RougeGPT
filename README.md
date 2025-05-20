# ChatGPT Clone

A modern ChatGPT clone built with React, Material-UI, and Node.js.

## Features

- Modern, responsive UI similar to ChatGPT
- Real-time chat interface
- Dark mode theme
- Material-UI components
- Express backend server

## Project Structure

```
.
├── frontend/          # React frontend application
│   ├── src/          # Source files
│   └── package.json  # Frontend dependencies
└── backend/          # Node.js backend server
    ├── server.js     # Express server
    └── package.json  # Backend dependencies
```

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory and add your environment variables:
   ```
   PORT=3001
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

The backend server will be available at `http://localhost:3001`

## API Integration

The backend is currently set up with a mock response. To integrate with the actual OpenAI API:

1. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

2. Update the chat endpoint in `backend/server.js` with the actual OpenAI API integration.

## Development

- Frontend runs on port 3000
- Backend runs on port 3001
- CORS is enabled for local development
- Hot reloading is enabled for both frontend and backend 