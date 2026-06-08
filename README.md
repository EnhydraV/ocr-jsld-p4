# Yoga Studio Management System

A full-stack web application for managing yoga studio operations, including session scheduling, teacher management, and user registrations.

## Tech Stack

### Backend
- Node.js 22 LTS
- Express.js 4.x
- TypeScript 5.9 (Strict Mode)
- Prisma ORM 5 + PostgreSQL 16
- Zod 4 (validation)
- JWT (authentication) + bcrypt (password hashing)
- Vitest 4 + Supertest + Testcontainers (tests)

### Frontend
- React 19 (Hooks only)
- TypeScript 6.x (Strict Mode)
- Vite 8.x
- TailwindCSS 4.x
- React Router 7.x
- Axios
- Vitest 4 + Testing Library + Cypress (tests)

### Infrastructure
- Docker + Docker Compose (PostgreSQL container)

## Features

### Authentication
- User registration
- User login with JWT tokens

### Sessions Management
- List all sessions / view session details
- Create, update, delete sessions (admin only)
- Join / leave sessions (regular users)

### Teachers
- List teachers / view teacher details

### User Profile
- View own profile (self-only access)
- Delete own account
- Self-promotion to admin (development convenience)

## Architecture

The backend follows a layered structure with a single responsibility per file:

- **routes** → **controllers** (HTTP) → **services** (business logic) → **Prisma** (data access)
- **DTOs** are Zod schemas validating every request body.
- Errors use a typed `AppError(statusCode, message)`. Controllers stay free of `try/catch`:
  each handler is wrapped in an `asyncHandler` that forwards rejections to a single global
  `errorHandler` middleware, which maps `AppError` to its status and returns a generic 500
  for anything unexpected (without leaking internal messages).

## Prerequisites

- Node.js 22 LTS or higher
- Docker and Docker Compose
- npm

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/EnhydraV/ocr-jsld-p4.git
cd ocr-jsld-p4
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Set up environment variables

Create a `.env` file in the `backend` directory (the defaults match the Docker Compose setup):

```env
DATABASE_URL="postgresql://yogauser:yogapass@localhost:5432/yogastudio"
JWT_SECRET="your-secret-key-change-me-in-production"
PORT=8080
NODE_ENV=development
```

### 4. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

This starts a `postgres:16-alpine` container on port 5432.

### 5. Run migrations and seed the database

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

The seed creates:
- 1 admin user - `yoga@studio.com` / `test!1234`
- 1 regular user - `user@test.com` / `test!1234`
- 3 teachers and 4 yoga sessions

## Running the Application

```bash
# Terminal 1 - API on http://localhost:8080
cd backend && npm run dev

# Terminal 2 - frontend on http://localhost:3000
cd frontend && npm run dev
```

## Default Credentials

| Role  | Email             | Password    |
|-------|-------------------|-------------|
| Admin | `yoga@studio.com` | `test!1234` |
| User  | `user@test.com`   | `test!1234` |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get a JWT token

### Sessions (protected)
- `GET /api/session` - List all sessions
- `GET /api/session/:id` - Get a session by ID
- `POST /api/session` - Create a session (admin only)
- `PUT /api/session/:id` - Update a session (admin only)
- `DELETE /api/session/:id` - Delete a session (admin only)
- `POST /api/session/:id/participate/:userId` - Join a session
- `DELETE /api/session/:id/participate/:userId` - Leave a session

### Teachers (protected)
- `GET /api/teacher` - List all teachers
- `GET /api/teacher/:id` - Get a teacher by ID

### Users (protected)
- `GET /api/user/:id` - Get a user (self-only)
- `DELETE /api/user/:id` - Delete own account
- `POST /api/user/promote-admin` - Promote the authenticated user to admin

## Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(50)
  firstName String   @db.VarChar(20)
  lastName  String   @db.VarChar(20)
  password  String   @db.VarChar(120)
  admin     Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  SessionParticipation[]
}

model Teacher {
  id        Int       @id @default(autoincrement())
  firstName String    @db.VarChar(20)
  lastName  String    @db.VarChar(20)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  sessions  Session[]
}

model Session {
  id           Int      @id @default(autoincrement())
  name         String   @db.VarChar(50)
  date         DateTime @db.Date
  description  String   @db.VarChar(2500)
  teacherId    Int
  teacher      Teacher  @relation(fields: [teacherId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  participants SessionParticipation[]
}

model SessionParticipation {
  sessionId Int
  userId    Int
  session   Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([sessionId, userId])
}
```

## Testing

Tests live in a dedicated `tests/` folder mirroring `src/` (never colocated), on both sides.

### Backend (Vitest)

```bash
npm test                  # Unit tests (services & controllers, Prisma mocked)
npm run test:integration  # Integration tests - real PostgreSQL via Testcontainers (Docker required)
npm run test:coverage     # Combined unit + integration coverage, 80% threshold (Docker required)
npm run typecheck         # Type-check the test suite (tsconfig.test.json)
```

- **Unit** tests mock Prisma through a factory and isolate each layer.
- **Integration** tests run the real services against a throwaway `postgres:16-alpine`
  container, exercising real relations, constraints, cascades and migrations - the things
  mocks cannot prove. They make up roughly 30% of the suite.

### Frontend

```bash
npm test               # Unit / component tests (Vitest + Testing Library, jsdom)
npm run test:coverage  # Coverage report
npm run e2e            # End-to-end tests (Cypress, headless, with code coverage)
npm run e2e:open      # Cypress interactive runner
```

## Development Scripts

### Backend

```bash
npm run dev              # Dev server (nodemon)
npm run build            # Compile TypeScript to dist/
npm start                # Run the production build
npm run prisma:generate  # Generate the Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed the database
npm run prisma:studio    # Open Prisma Studio
```

### Frontend

```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview the production build
```

## Project Structure

```
ocr-jsld-p4/
├── backend/
│   ├── src/
│   │   ├── controllers/   # HTTP request handlers (no try/catch)
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth + global error handler
│   │   ├── dto/           # Zod validation schemas
│   │   ├── errors/        # AppError
│   │   ├── utils/         # JWT, Prisma singleton, asyncHandler, mappers
│   │   ├── routes/        # API routes
│   │   └── app.ts         # Express app setup
│   ├── tests/             # Mirror of src/ + integration/ (Testcontainers)
│   ├── prisma/            # schema.prisma + seed.ts
│   └── vitest.*.config.ts # unit / integration / coverage configs
├── frontend/
│   ├── src/               # pages, components, hooks, services, types, utils
│   ├── tests/             # Mirror of src/ + e2e/ (Cypress)
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## Troubleshooting

### Database connection issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Port already in use

```bash
# Check what's using port 8080
lsof -i :8080

# Check what's using port 3000
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

### Prisma issues

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

## Contributing

Please follow the existing code style and ensure all tests pass before submitting changes.

## License

MIT
