# Distance Comparison App

## Overview

This is a full-stack web application that allows users to compare distances and travel times from a single origin to multiple destinations. The app provides a Japanese-language interface for calculating routes using different transportation modes (driving, walking, transit, bicycling) and leverages Google Maps APIs for accurate distance calculations.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom Japanese-optimized design
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **API Design**: RESTful API endpoints
- **File Upload**: Multer for handling image uploads
- **Image Processing**: Sharp for image optimization

### Database Architecture
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon Database)
- **Connection**: Connection pooling with @neondatabase/serverless
- **Schema**: Type-safe schema definitions with automatic migrations

## Key Components

### Core Features
1. **Distance Calculation Service**
   - Integration with Google Maps Distance Matrix API
   - Support for multiple transportation modes
   - Batch processing of multiple destinations
   - Real-time route optimization

2. **User Management System**
   - Anonymous user tracking via localStorage
   - Usage quota management (3 queries per month for free users)
   - Test user bypass system for development

3. **Content Management System**
   - Article creation and management
   - Rich text editor with TipTap
   - Image upload and optimization
   - View tracking and analytics

4. **Admin Dashboard**
   - Password-protected admin interface
   - Article management capabilities
   - Usage statistics and analytics
   - Data cleanup utilities

### UI/UX Components
- **Distance Form**: Multi-destination input with autocomplete
- **Results Table**: Sortable distance/time comparison table
- **Google Maps Integration**: Interactive map display with route visualization
- **Advertisement System**: Zucks Ad Network integration with usage limits
- **Responsive Design**: Mobile-first approach with desktop optimization

## Data Flow

1. **User Input**: Users enter origin and multiple destinations
2. **Autocomplete**: Google Places API provides location suggestions
3. **Calculation**: Server-side Google Maps API calls for distance calculations
4. **Results Display**: Formatted results with map visualization options
5. **Usage Tracking**: Anonymous usage counting with monthly limits
6. **Ad Display**: Advertisement modal for usage limit enforcement

### Database Schema
- **users**: Admin user accounts
- **userUsage**: Monthly usage tracking per user
- **distanceQuery**: Query history and results storage
- **articles**: Blog/article content management

## External Dependencies

### Google Services
- **Google Maps JavaScript API**: Map rendering and interaction
- **Google Places API**: Location autocomplete functionality
- **Google Distance Matrix API**: Distance and time calculations
- **Google Analytics**: Usage tracking and analytics

### Third-Party Services
- **Neon Database**: PostgreSQL hosting
- **Zucks Ad Network**: Advertisement serving
- **SendGrid**: Email service integration (configured but not actively used)

### Development Tools
- **Replit Integration**: Development environment optimization
- **TypeScript**: Type safety across the entire stack
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle
- **Backend**: esbuild bundles Express server for production
- **Database**: Drizzle migrations handle schema updates

### Environment Configuration
- **Development**: Local development with hot reloading
- **Production**: Single-server deployment with static file serving
- **Database**: Environment-based connection string configuration

### Performance Optimizations
- **Image Optimization**: Sharp processing for uploaded images
- **Caching**: Strategic caching of API responses
- **Bundle Splitting**: Optimized JavaScript bundles
- **SEO**: Structured data and meta tag optimization

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 02, 2025. 広告を一時的に非表示に変更（コメントアウト）
  - フッター広告（Zucks Ad Network）を非表示
  - モーダル広告（AdModal）を非表示
  - 利用制限回数による制御を一時的に無効化
  - 将来の再表示・再有効化に備えてコメントアウトで保持
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```