# Omnius Architecture Platform

## Overview

This is a comprehensive architecture platform that unifies creation and control aspects of software development. The system implements a universal artifact model that tracks relationships between requirements, code, database schemas, API contracts, and other development artifacts. It provides automated compliance checking, code generation, and documentation capabilities through both web interface and command-line interface (CLUI).

The platform follows a "Spec-Status-Reconcile" pattern where declarative specifications are continuously compared against actual implementation status, with automated reconciliation loops to maintain alignment between architecture and code.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite Build System**: Fast development server with hot module replacement
- **TailwindCSS + shadcn/ui**: Utility-first CSS framework with pre-built component library
- **TanStack Query**: Server state management for API interactions and caching
- **Wouter**: Lightweight client-side routing
- **Theme System**: Dark/light mode support with CSS custom properties

### Backend Architecture
- **Express.js Server**: RESTful API server with middleware-based request processing
- **TypeScript**: Full type safety across client and server with shared schemas
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **PostgreSQL**: Primary database for storing artifacts, relationships, and metadata
- **Modular Storage Interface**: Abstracted data layer supporting multiple implementations

### Data Model Design
- **Artifact-Centric**: Everything is represented as artifacts (requirements, code, tests, docs, etc.)
- **Graph-Based Relationships**: M:N relationships between artifacts with typed links
- **Multi-Tenant**: Project-based isolation with user ownership
- **Versioned Content**: Content hashing for change detection and version tracking
- **Flexible Metadata**: JSONB storage for extensible artifact properties

### Core Modules
- **Tapestry**: Block-based artifact creation and modeling
- **Architecture Graph**: Visualization and analysis of artifact relationships
- **SACC (Compliance Engine)**: Automated checking of spec-to-implementation alignment
- **SAR Discovery**: Legacy system reverse engineering and import
- **Code Generation**: Template-based scaffolding and automated code creation
- **Documentation Engine**: Live documentation generation from artifact graph
- **CLUI Console**: Command-line interface for all platform operations

### API Architecture
- **RESTful Endpoints**: Standard HTTP methods for CRUD operations
- **Resource-Based URLs**: Hierarchical structure following REST conventions
- **JSON Communication**: Standardized request/response format
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Validation**: Zod schema validation for type safety

### Authentication & Authorization
- **Multi-Tenant Support**: Project-based access control
- **Role-Based Access**: Developer, architect, and admin roles
- **God Mode**: Special elevated privileges for root architects with security controls

## External Dependencies

### Database Systems
- **Neon Database**: PostgreSQL hosting service (@neondatabase/serverless)
- **Drizzle Kit**: Database migration and schema management tool
- **connect-pg-simple**: PostgreSQL session store for Express

### UI Framework Dependencies
- **Radix UI**: Headless UI primitives for accessibility and behavior
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe CSS class composition
- **Embla Carousel**: Touch-friendly carousel implementation
- **React Hook Form**: Form state management and validation

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing and optimization
- **Autoprefixer**: Automatic vendor prefix addition

### Integration Capabilities
- **Git Repositories**: Source code ingestion and synchronization
- **CI/CD Pipelines**: GitHub Actions, GitLab CI, Jenkins integration
- **Database Schemas**: Multi-database reverse engineering support
- **REST/GraphQL APIs**: Contract-first API development workflow

### Planned Integrations
- **CASE Tools**: Architecture modeling tool import/export
- **BPMN/DMN Engines**: Business process and decision management
- **Telemetry Systems**: Runtime metrics and logging integration
- **AI Services**: Code generation, requirement extraction, and compliance analysis