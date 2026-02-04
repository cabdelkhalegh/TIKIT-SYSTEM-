# TIKIT-SYSTEM 🎫

A modern ticket management system with a clean web interface for managing support tickets.

## 🚀 Quick Start

### Option 1: Run with Docker (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at: **http://localhost:3000**

### Option 2: Run with Node.js

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run in development mode with auto-reload
npm run dev
```

## 📁 Project Structure

```
TIKIT-SYSTEM-/
├── public/              # Frontend files (main portal)
│   ├── index.html       # Main portal page
│   ├── css/
│   │   └── styles.css   # Application styles
│   └── js/
│       └── app.js       # Frontend JavaScript
├── server.js            # Express backend server
├── package.json         # Node.js dependencies
├── Dockerfile           # Docker configuration
└── docker-compose.yml   # Docker Compose configuration
```

## 🔧 Features

- ✅ Create, view, and delete tickets
- ✅ Set ticket priority (Low, Medium, High)
- ✅ Track ticket status
- ✅ RESTful API
- ✅ Responsive web interface
- ✅ Docker deployment ready

## 📡 API Endpoints

- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/:id` - Update a ticket
- `DELETE /api/tickets/:id` - Delete a ticket
- `GET /health` - Health check endpoint

## 🛠️ Build & Deployment

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Deploy with Docker
```bash
# Build the Docker image
docker build -t tikit-system .

# Run the container
docker run -p 3000:3000 tikit-system
```

### Stop the Application
```bash
# If running with Docker Compose
docker-compose down

# If running with Node.js
# Press Ctrl+C in the terminal
```

## 🌐 Access the Application

Once deployed, access the main portal at:
- **Local**: http://localhost:3000
- **API**: http://localhost:3000/api/tickets

## 📝 Requirements

- Node.js 18+ (if running without Docker)
- Docker & Docker Compose (for containerized deployment)

## 🐛 Troubleshooting

If the application fails to start:
1. Ensure port 3000 is not in use
2. Check that all files are in the correct folders
3. Run `npm install` to ensure dependencies are installed
4. Check Docker logs: `docker-compose logs`

## 📄 License

ISC
