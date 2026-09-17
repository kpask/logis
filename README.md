# Workis

A work in progress workplace and project management platform that helps teams collaborate, track time, and manage projects across multiple locations.

**Live demo**: [http://158.179.202.161/](http://158.179.202.161/)  
Please note: Geolocation functionality is temporarily unavailable pending HTTPS configuration.

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

### Option A: Docker (recommended)

The fastest way to run the full stack (PostgreSQL + backend + frontend) is Docker Compose:

```bash
cp .env.template .env
```

Edit `.env` and set your own database credentials and JWT secret, then:

```bash
docker compose up -d
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### Option B: Local development

#### 1. Clone the Repository

```bash
cd /path/to/workis
```

#### 2. Backend Setup

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

#### 3. Frontend Setup

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

#### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

- Create a new account or login with existing credentials
- Start managing workplaces and projects

## API Endpoints

### Authentication

- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Create a new user account
- `POST /auth/register/invitation` - Register a new user via invitation link

### Users

- `GET /user/{id}` - Get user profile by ID
- `PUT /user` - Update the authenticated user's profile
- `GET /me/settings` - Get the authenticated user's settings
- `PUT /me/settings` - Update the authenticated user's settings

### Company

- `POST /company` - Create a new company
- `GET /company` - Get the authenticated user's company
- `PUT /company` - Update the company
- `POST /company/manager/{id}` - Promote a user to company manager
- `DELETE /company/manager/{id}` - Demote a manager back to a regular worker
- `PUT /company/owner/{id}` - Transfer company ownership to another member
- `POST /company/kick/{id}` - Remove a member from the company
- `GET /company/worker-count` - Get total number of workers in the company
- `GET /company/members` - Get list of all company members
- `GET /company/settings` - Get the company settings
- `PUT /company/settings` - Update the company settings

### Workplaces

- `POST /workplaces` - Create a new workplace
- `GET /workplaces` - Get all workplaces for the authenticated user's company
- `GET /workplaces/{id}` - Get a specific workplace
- `GET /workplaces/{id}/projects` - Get all projects in a workplace
- `PUT /workplaces/{id}` - Update a workplace
- `DELETE /workplaces/{id}` - Delete a workplace

### Projects

- `POST /projects` - Create a new project
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update a project
- `DELETE /projects/{id}` - Delete a project
- `POST /projects/{id}/assign/{workerId}` - Assign a worker to a project
- `POST /projects/{id}/status` - Update project status
- `GET /projects/{id}/workers` - Get all workers assigned to a project
- `DELETE /projects/{id}/workers/{workerId}` - Remove a worker from a project

### Time Tracking

- `POST /projects/{projectId}/time-entries/start` - Start a time entry for a project
- `POST /me/time-entries/{id}/stop` - Stop an active time entry
- `POST /projects/{projectId}/time-entries` - Create a manual project time entry
- `GET /me/time-entries` - Get the authenticated user's time entries
- `GET /time-entries/{userId}` - Get a company member's time entries
- `GET /projects/{projectId}/time-entries` - Get all time entries for a project
- `GET /workplaces/{workplaceId}/time-entries` - Get all time entries for a workplace
- `PUT /time-entries/{id}` - Update a time entry
- `DELETE /time-entries/{id}` - Delete a time entry
- `GET /me/time-worked` - Get the authenticated user's per-day worked time
- `GET /time-worked/{userId}` - Get a company member's per-day worked time
- `GET /projects/{projectId}/time-worked` - Get per-user, per-day worked time for a project
- `GET /workplaces/{workplaceId}/time-worked` - Get per-user, per-day worked time for a workplace
- `GET /company/time-worked` - Get per-user, per-day worked time for the whole company
- `GET /me/time-worked/export` - Export the authenticated user's worked hours (PDF/CSV)
- `GET /time-worked/{userId}/export` - Export a company member's worked hours (PDF/CSV)
- `GET /company/time-worked/export` - Export every member's worked hours (PDF/CSV)

### Invitations

- `GET /invites` - Get all invitations received by the user
- `GET /invites/sent` - Get all invitations sent by the user
- `POST /invites` - Send an invitation to a user
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
