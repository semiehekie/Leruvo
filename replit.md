# ExamGuard - Secure Educational Testing Platform

## Overview

ExamGuard is a comprehensive web-based examination platform designed for educational institutions. The system enables teachers to create and monitor secure online exams while providing students with a controlled testing environment. The platform emphasizes security through real-time monitoring, violation detection, and enforced browser restrictions to maintain exam integrity.

The application serves two primary user roles: teachers who can create classes, design exams, and monitor student activity in real-time, and students who can join classes and take exams under secure, monitored conditions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built using React with TypeScript, leveraging modern development practices and component-based architecture. The UI is constructed using shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable interface elements. Styling is handled through Tailwind CSS with a comprehensive design system supporting both light and dark themes.

The frontend employs a single-page application (SPA) pattern with client-side routing via Wouter, providing smooth navigation between different views. State management is handled through React Query (TanStack Query) for server state and React's built-in state management for local component state.

### Backend Architecture
The server is implemented using Express.js with TypeScript, following a RESTful API design pattern. The application uses a layered architecture separating route handlers, business logic, and data access layers. Real-time communication is facilitated through WebSocket connections for exam monitoring and violation reporting.

The backend implements comprehensive authentication and authorization using Replit's OpenID Connect integration with Passport.js. Session management is handled through express-session with PostgreSQL storage for persistence across server restarts.

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM providing type-safe database operations. The schema includes core entities for users, classes, exams, submissions, and real-time monitoring sessions. Relationships are properly defined with foreign key constraints ensuring data integrity.

Key tables include users with role-based access control, classes with unique join codes, exams with configurable security settings, and exam sessions for tracking student activity and violations during test taking.

### Real-time Monitoring System
A sophisticated monitoring system tracks student behavior during exams using WebSocket connections. The system detects various violation types including fullscreen exits, tab switching, window focus changes, and browser navigation attempts. Violations are logged in real-time and broadcasted to supervising teachers.

The monitoring architecture supports multiple concurrent exam sessions with isolated communication channels, ensuring that teacher dashboards receive relevant updates only for their specific exams.

### Authentication and Authorization
The platform implements Replit-based authentication using OpenID Connect, providing seamless integration with the Replit ecosystem. Role-based access control differentiates between teacher and student permissions, with middleware ensuring appropriate access to protected routes.

Session security is enhanced through secure cookie configuration, CSRF protection, and automatic session expiration. The authentication system supports both development and production environments with environment-specific configurations.

### Document Processing and PDF Generation
The system includes capabilities for processing exam submissions and generating PDF reports using Puppeteer. This enables automated grading workflows and standardized report generation for administrative purposes.

## External Dependencies

### Database and ORM
- **PostgreSQL**: Primary database system using Neon serverless for cloud deployment
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **connect-pg-simple**: PostgreSQL session store for express-session

### Authentication Services
- **Replit OpenID Connect**: Primary authentication provider
- **Passport.js**: Authentication middleware with OpenID Connect strategy

### Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time monitoring
- **Custom WebSocket server**: Built on top of Node.js HTTP server for exam monitoring

### Frontend Dependencies
- **React Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight client-side routing

### Development and Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration

### Monitoring and Utilities
- **Puppeteer**: Headless browser automation for PDF generation
- **date-fns**: Date manipulation and formatting utilities
- **nanoid**: Secure ID generation for unique identifiers
- **memoizee**: Function memoization for performance optimization