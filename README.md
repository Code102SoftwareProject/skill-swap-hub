# 🚀 Skill Swap Hub

**A dynamic peer-to-peer skill exchange platform for students and professionals**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.13.0-green)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-orange)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-38B2AC)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [🎯 Core Components](#-core-components)
- [🔐 Authentication & Security](#-authentication--security)
- [📊 Admin Dashboard](#-admin-dashboard)
- [🧪 Testing](#-testing)
- [📚 API Documentation](#-api-documentation)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## Overview

Skill Swap Hub is a comprehensive platform that connects individuals looking to exchange skills and knowledge. Whether you're a student wanting to learn web development in exchange for teaching graphic design, or a professional looking to share expertise, our platform facilitates meaningful skill exchanges through a robust matching system.

## ✨ Key Features

### 🎯 **Core Functionality**
- **Smart Skill Matching**: AI-powered algorithm to match users based on skills offered and needed
- **Real-time Chat System**: Secure messaging with file sharing and encryption
- **Video Meeting Integration**: Built-in Daily.co integration for virtual skill sessions
- **Session Management**: Complete workflow for creating, managing, and completing skill exchange sessions
- **Progress Tracking**: Monitor learning progress and session outcomes

### 🌟 **Community Features**
- **Community Forums**: Discussion boards with personalized feeds
- **Success Stories**: Showcase successful skill exchanges
- **User Reviews & Ratings**: Build trust through peer feedback
- **Trending Skills**: Discover popular skills in the community

### 🛡️ **Security & Trust**
- **KYC Verification**: Know Your Customer verification for enhanced security
- **Document Verification**: Secure document upload and verification system
- **User Reporting**: Comprehensive reporting system for community safety
- **Admin Moderation**: Advanced admin tools for platform management

### 🎨 **User Experience**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching capability
- **Real-time Notifications**: Stay updated with instant notifications
- **Advanced Search**: Powerful search functionality with filters
- **Badge System**: Gamification through skill badges and achievements

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15.4.1 with App Router
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React, React Icons, Heroicons
- **Animations**: Framer Motion 11.18.2

### **Backend**
- **Runtime**: Node.js with Next.js API Routes
- **Database**: MongoDB 6.13.0 with Mongoose ODM
- **Real-time**: Socket.IO 4.8.1
- **Authentication**: NextAuth.js with JWT
- **File Storage**: Cloudflare R2 with AWS SDK

### **External Services**
- **Video Calls**: Daily.co API
- **Email**: SendGrid
- **AI**: Google Gemini API for chatbot
- **Search**: Elasticsearch (optional)
- **Speech**: Google Cloud Speech-to-Text

### **Development Tools**
- **Testing**: Jest with Testing Library
- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript with strict mode
- **Package Manager**: npm

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Cloudflare R2 account (for file storage)
- Daily.co account (for video meetings)
- SendGrid account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/skill-swap-hub.git
   cd skill-swap-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/skill-swap-hub
   
   # Authentication
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   
   # Cloudflare R2
   R2_ACCESS_KEY_ID=your-r2-access-key
   R2_SECRET_ACCESS_KEY=your-r2-secret-key
   R2_BUCKET_NAME=your-bucket-name
   R2_ENDPOINT=your-r2-endpoint
   
   # Daily.co
   DAILY_API_KEY=your-daily-api-key
   
   # SendGrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yoursite.com
   
   # Google APIs
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Additional Setup Commands

```bash
# Setup super admin account
npm run setup:super-admin

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Build for production
npm run build
```

## 📁 Project Structure

```
skill-swap-hub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── forum/             # Community forums
│   │   ├── login/             # Authentication pages
│   │   └── ...
│   ├── components/            # Reusable UI components
│   │   ├── Admin/             # Admin-specific components
│   │   ├── Dashboard/         # Dashboard components
│   │   ├── communityForum/    # Forum components
│   │   ├── messageSystem/     # Chat components
│   │   ├── sessionSystem/     # Session management
│   │   └── ui/                # Base UI components
│   ├── lib/                   # Utilities and configurations
│   │   ├── models/            # MongoDB schemas
│   │   ├── context/           # React contexts
│   │   ├── middleware/        # Authentication & authorization
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API service functions
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Helper utilities
├── __tests__/                 # Test files
├── docs/                      # Documentation
├── public/                    # Static assets
├── scripts/                   # Utility scripts
└── documentation/             # Docusaurus documentation site
```

## 🔧 Configuration

### Database Models
The platform uses MongoDB with Mongoose for the following core entities:
- **Users**: User profiles with skills and preferences
- **Skills**: Available skills categorized by type
- **Sessions**: Skill exchange sessions between users
- **Messages**: Chat messages with encryption
- **Forums**: Community discussion posts
- **Reviews**: User ratings and feedback
- **Notifications**: Real-time notification system

### File Storage
Files are stored using Cloudflare R2 with automatic CDN distribution:
- **Upload API**: `POST /api/file/upload`
- **Retrieve API**: `GET /api/file/retrieve`
- **Supported formats**: Images, documents, videos

## 🎯 Core Components

### Skill Matching System
- **Algorithm**: Intelligent matching based on user preferences
- **Filters**: Location, skill level, availability
- **Recommendations**: ML-powered user suggestions

### Real-time Communication
- **Chat System**: Encrypted messaging with file sharing
- **Video Meetings**: Daily.co integration with recording
- **Notifications**: Real-time updates via Socket.IO

### Session Management
- **Creation**: Easy session setup with skill selection
- **Progress Tracking**: Monitor session milestones
- **Completion**: Review system and badge awards

## 🔐 Authentication & Security

### Authentication Methods
- **Email/Password**: Traditional authentication
- **Google OAuth**: Social login integration
- **JWT Tokens**: Secure session management
- **OTP Verification**: Email-based verification

### Security Features
- **Message Encryption**: End-to-end chat encryption
- **File Validation**: Secure file upload validation
- **Rate Limiting**: API rate limiting protection
- **CORS Configuration**: Secure cross-origin requests

## 📊 Admin Dashboard

### Administrative Features
- **User Management**: View, suspend, and manage users
- **Content Moderation**: Forum post and message moderation
- **Analytics**: Platform usage statistics and insights
- **Skill Verification**: Approve skill verification requests
- **Report Management**: Handle user reports and disputes

### Admin Hierarchy
- **Super Admin**: Full platform access
- **Content Moderator**: Content management only
- **User Manager**: User-related operations only

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: API route testing
- **Component Tests**: React component testing
- **Manual Testing**: Comprehensive test documentation

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test suites
npm run test:community-forums
```

## 📚 API Documentation

### Core API Routes

#### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/forgot-password` - Password reset
- `POST /api/verify-otp` - OTP verification

#### User Management
- `GET /api/users` - Get user list
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user profile
- `POST /api/users/verification-request` - Submit verification

#### Skills & Matching
- `GET /api/skills` - Get available skills
- `POST /api/matches/find` - Find skill matches
- `POST /api/listings` - Create skill listing
- `GET /api/matches` - Get user matches

#### Sessions
- `POST /api/session` - Create session
- `GET /api/session/[id]` - Get session details
- `PUT /api/session/[id]/accept` - Accept session
- `POST /api/session/complete` - Complete session

#### Communication
- `GET /api/messages` - Get chat messages
- `POST /api/messages` - Send message
- `POST /api/meeting` - Create meeting
- `GET /api/notification` - Get notifications

### WebSocket Events
- `message:new` - New message received
- `notification:new` - New notification
- `user:online` - User online status
- `session:update` - Session status update

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Setup
Ensure all environment variables are properly configured for production:
- Database connection strings
- API keys and secrets
- CORS origins
- File storage credentials

### Recommended Hosting
- **Platform**: Vercel, Netlify, or AWS
- **Database**: MongoDB Atlas
- **CDN**: Cloudflare R2 + CDN
- **Monitoring**: Consider adding error tracking

## 🤝 Contributing

### Development Guidelines
- Follow the existing code style and structure
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages

### File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **CSS Modules**: `component.module.css`
- **Types**: PascalCase with descriptive names

### Code Standards
- **Indentation**: Use tabs for all files
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **File headers**: Include file path comments

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

For questions, issues, or contributions:
- **Issues**: [GitHub Issues](https://github.com/your-org/skill-swap-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/skill-swap-hub/discussions)
- **Email**: support@skillswaphub.com

---

**Built with ❤️ by the Skill Swap Hub Team**
