# portfolio-mcp

A backend API service for a personal portfolio platform, built with **NestJS** and integrated with **MCP (Model Context Protocol)**. This project powers an AI-enhanced portfolio system featuring CV management, GitHub repository syncing, real-time chat via WebSocket, and an HR/interviewer session interface — all served through a well-structured REST API with JWT authentication.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Scripts](#scripts)
- [License](#license)

---

## Overview

`portfolio-mcp` is the backend service behind a developer portfolio platform. It provides:

- **CMS endpoints** for managing CV data, GitHub repos, and conversations
- **MCP-powered AI tools** for querying CV info, GitHub repos, HR sessions, and chat history via an AI model (Google Gemini)
- **Real-time WebSocket** messaging via Socket.IO
- **JWT-based auth** with role-based access control
- **Swagger UI** for interactive API docs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Database | PostgreSQL (via Prisma ORM) |
| AI / LLM | Google Generative AI (Gemini) |
| MCP Protocol | `@modelcontextprotocol/sdk` |
| Auth | JWT (`@nestjs/jwt`) + bcrypt |
| Real-time | WebSocket / Socket.IO (`@nestjs/websockets`) |
| API Docs | Swagger (`@nestjs/swagger`) |
| Validation | class-validator + class-transformer + Zod |
| HTTP Security | Helmet, Cookie-parser, Morgan |
| File Upload | Multer |

---

## Architecture

The project follows **NestJS modular architecture**, cleanly separating concerns:

```
src/
├── common/          # Shared DTOs, response helpers, REST API utils
├── config/          # Swagger configuration
├── decorator/       # Custom decorators (Public, Roles, User)
├── filter/          # Global exception filter
├── interceptor/     # Logging interceptor
├── objects/         # Enums and constants
└── modules/
    ├── auth/            # JWT authentication & guards
    ├── users/           # User management
    ├── cms/             # CMS dashboard
    ├── cms-conv/        # Conversation management (CMS)
    ├── cms-cv/          # CV management (CMS)
    ├── cms-repo/        # GitHub repo management (CMS)
    ├── chat/            # AI chat endpoint
    ├── socket/          # WebSocket gateway (real-time messaging)
    ├── cookies/         # Cookie management
    ├── db-connect/      # Prisma database connection
    ├── hr-session/      # HR/interviewer session tracking
    ├── mcp-cv/          # MCP tool: CV data exposure
    ├── mcp-github/      # MCP tool: GitHub repo exposure
    ├── mcp-hr/          # MCP tool: HR session tool
    ├── mcp-chat-history/# MCP tool: Chat history exposure
    ├── shared/          # Shared server config service
    └── utils/           # Utility functions
```

---

## Features

### Authentication
- JWT-based login with bcrypt password hashing
- Role-based access control via `@Roles()` decorator and `RolesGuard`
- Public route exemption via `@Public()` decorator

### CMS (Content Management)
- **CV Management** (`/cms-cv`): Create, read, update portfolio CV entries
- **Repository Management** (`/cms-repo`): Create, import, and update GitHub repo metadata
- **Conversation Management** (`/cms-conv`): Manage chat conversations and user-agent tracking

### AI Chat
- Chat endpoint (`/chat`) powered by Google Gemini
- MCP server integration enabling AI to call structured tools for:
  - Fetching CV data (`mcp-cv`)
  - Fetching GitHub repositories (`mcp-github`)
  - Fetching HR session records (`mcp-hr`)
  - Fetching chat history (`mcp-chat-history`)

### Real-time WebSocket
- Socket.IO gateway (`/socket`) for real-time bidirectional messaging
- Message DTO validation on incoming events

### HR Session Tracking
- Records visitor/interviewer sessions with user-agent metadata
- Queryable via MCP tool for AI-assisted HR interactions

### Observability
- Global logging interceptor (Morgan + custom)
- Global exception filter for consistent error responses
- Structured API response wrapper (`response.helper.ts`)

---

## Project Structure

```
.
├── src/
│   ├── main.ts                    # App bootstrap & Swagger setup
│   ├── app.module.ts              # Root module
│   ├── common/                    # Shared utilities & base DTOs
│   ├── config/swagger.ts          # Swagger config
│   ├── decorator/                 # Custom NestJS decorators
│   ├── filter/                    # Global exception filter
│   ├── interceptor/               # HTTP logging interceptor
│   ├── objects/                   # Enums (EApiPath, EPermission) & constants
│   └── modules/
│       ├── auth/                  # Auth module (login, JWT, guards)
│       ├── users/                 # Users CRUD
│       ├── cms/                   # CMS root
│       ├── cms-cv/                # CV CMS
│       ├── cms-repo/              # Repo CMS
│       ├── cms-conv/              # Conversation CMS
│       ├── chat/                  # AI chat
│       ├── socket/                # WebSocket gateway
│       ├── cookies/               # Cookie service
│       ├── db-connect/            # Prisma service
│       ├── hr-session/            # HR session tracking
│       ├── mcp-cv/                # MCP CV tool
│       ├── mcp-github/            # MCP GitHub tool
│       ├── mcp-hr/                # MCP HR tool
│       ├── mcp-chat-history/      # MCP Chat history tool
│       ├── shared/                # Server config service
│       └── utils/                 # App utilities
├── public/
│   ├── index.html                 # Static landing page
│   └── css/swagger.css            # Custom Swagger UI styles
├── prisma.config.ts               # Prisma config
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL database
- Google Gemini API key

### Installation

```bash
npm install
```

### Database Setup

```bash
# Initialize Prisma (first time)
npm run db:init

# Pull schema from existing DB
npm run db:pull

# Generate Prisma client
npm run db:generate
```

### Running the App

```bash
# Development
npm run start:dev

# Debug mode
npm run start:debug

# Production
npm run start:prod
```

---

## Environment Variables

Create a `.env` file at the project root. Required variables (based on module usage):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# App
PORT=3000
```

---

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api
```

Custom Swagger styles are served from `public/css/swagger.css`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run start` | Start in production mode |
| `npm run start:dev` | Start in watch/dev mode |
| `npm run start:prod` | Run compiled production build |
| `npm run build` | Compile TypeScript |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:pull` | Sync schema from database |
| `npm run lint` | Lint and auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |

---

## License

UNLICENSED — private project.
