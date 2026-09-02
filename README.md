# Workis

A work in progress workplace and project management platform that helps teams collaborate, track time, and manage projects across multiple locations.

## Features

- **User Authentication**: Secure login/signup with JWT-based authentication
- **Company & Workplace Management**: Create and manage multiple workplaces for your organization
- **Project Management**: Organize work into projects with status tracking
- **Time Tracking**: Log and monitor time entries for projects
- **Team Collaboration**: Invite team members to workplaces via invitation links
- **Location Mapping**: Track workplace locations with interactive maps
- **User Profiles**: Manage user profiles and team roles

## Tech Stack

### Backend

- **Framework**: Spring Boot 4.1.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Build Tool**: Gradle
- **API Documentation**: OpenAPI/Swagger

### Frontend

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet
- **Testing**: ESLint

**Note**: The frontend UI was worked on using AI tooling for rapid prototyping.

## Prerequisites

- **Java**: 17 or higher
- **Node.js**: 18 or higher
- **npm**: 9 or higher
- **PostgreSQL**: 12 or higher

## Getting Started

### 1. Clone the Repository

```bash
cd /path/to/workis
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

**Configure the database connection** in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/workis
spring.datasource.username=your_postgres_user
spring.datasource.password=your_postgres_password
spring.jpa.hibernate.ddl-auto=update
```

**Build and run the backend**:

```bash
./gradlew bootRun
```

The API will be available at `http://localhost:8080`

**API Documentation**: Visit `http://localhost:8080/swagger-ui.html` for interactive API docs.

### 3. Frontend Setup

In a new terminal, navigate to the frontend directory:

```bash
cd frontend
```

**Install dependencies**:

```bash
npm install
```

**Start the development server**:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

- Create a new account or login with existing credentials
- Start managing workplaces and projects

## API Endpoints

### Authentication

- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Create a new user account
- `POST /auth/register/invitation/` - Register a new user via invitation link

### Users

- `GET /user/{id}` - Get user profile by ID

### Companies

- `POST /companies` - Create a new company
- `POST /companies/{id}/managers` - Promote a user to company manager
- `GET /companies/{id}` - Get company details
- `GET /companies/{id}/workerCount` - Get total number of workers in company
- `GET /companies/{id}/members` - Get list of all company members

### Workplaces

- `POST /workplace` - Create a new workplace
- `GET /workplaces` - Get all workplaces for the authenticated user's company
- `GET /workplaces/{id}` - Get specific workplace details
- `GET /workplaces/{id}/projects` - Get all projects in a workplace
- `DELETE /workplaces/{id}` - Delete a workplace

### Projects

- `POST /project` - Create a new project
- `GET /project/{id}` - Get project details
- `POST /project/{id}/assign` - Assign a worker to a project
- `POST /project/{id}/status` - Update project status
- `GET /project/{id}/workers` - Get all workers assigned to a project
- `DELETE /project/{id}/workers/{workerId}` - Remove a worker from a project

### Time Tracking

- `POST /projects/{projectId}/time-entries/start` - Start a new time entry
- `POST /me/time-entries/{id}/stop` - Stop an active time entry
- `POST /projects/{projectId}/time-entries` - Create a manual time entry
- `GET /me/time-entries` - Get all time entries for authenticated user
- `GET /projects/{projectId}/time-entries` - Get all time entries for a project
- `GET /workplaces/{workplaceId}/time-entries` - Get all time entries for a workplace
- `PUT /time-entries/{id}` - Update a time entry
- `DELETE /time-entries/{id}` - Delete a time entry

### Invitations

- `GET /invites/` - Get all invitations received by the user
- `GET /invites/sent` - Get all invitations sent by the user
- `POST /invites/` - Send an invitation to a user
- `GET /invites/{token}` - Get invitation details by token
- `POST /invites/{token}` - Accept an invitation

## Database Schema

Key entities:

- **User**: User accounts with authentication
- **Company**: Organization entity
- **Workplace**: Physical or virtual work locations
- **Project**: Work projects with status tracking
- **TimeEntry**: Time tracking records
- **ProjectWorker**: User-to-project assignments
- **CompanyInvitation**: Team invitation system

## Configuration

### Environment Variables (Backend)

Create an `application.properties` file or set environment variables:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/workis
spring.datasource.username=postgres
spring.datasource.password=password

# JWT
jwt.secret=your-secret-key-here
jwt.expiration=86400000

# Server
server.port=8080
```

### CORS Configuration

The backend is configured to accept requests from the frontend. Update CORS settings in the backend configuration if needed.
