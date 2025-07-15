# Developer Guide

Welcome to the **Skill Swap Hub Developer Documentation**. This guide covers everything you need to know to contribute to, extend, or integrate with the Skill Swap Hub platform.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + OAuth (Google, GitHub)
- **Real-time Features**: Socket.io
- **Video Calls**: Daily.co API
- **File Storage**: AWS S3
- **Email**: SendGrid
- **Search**: Elasticsearch

### Project Structure
```
skill-swap-hub/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── (auth)/            # Auth pages
│   │   ├── admin/             # Admin interface
│   │   └── dashboard/         # User dashboard
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility libraries
│   ├── services/              # External service integrations
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Helper functions
├── scripts/                   # Database scripts and utilities
├── documentation/             # This documentation site
└── docs/                      # Additional documentation
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (local or cloud)
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Code102SoftwareProject/skill-swap-hub.git
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
   MONGODB_URI=mongodb://localhost:27017/skillswaphub
   
   # Authentication
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   
   # OAuth Providers
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Email Service
   SENDGRID_API_KEY=your-sendgrid-api-key
   
   # File Storage
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_S3_BUCKET=your-s3-bucket
   
   # Video Calls
   DAILY_API_KEY=your-daily-api-key
   
   # Search
   ELASTICSEARCH_URL=http://localhost:9200
   ```

4. **Set up the database**
   ```bash
   npm run setup:database
   npm run setup:super-admin
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 📝 Coding Standards

### TypeScript
- **Strict mode enabled** - all code must pass TypeScript checks
- **Type definitions** - create types for all data structures
- **No `any` types** - use proper typing or `unknown`

### Code Style
- **ESLint configuration** - follows Next.js recommended rules
- **Prettier formatting** - automatic code formatting
- **Tab indentation** - use tabs instead of spaces
- **File naming**: 
  - Components: `PascalCase.tsx`
  - Utilities: `camelCase.ts`
  - API routes: `kebab-case.ts`

### Component Guidelines
```typescript
// components/UserProfile.tsx
import { FC } from 'react';

interface UserProfileProps {
	user: User;
	onEdit?: () => void;
}

const UserProfile: FC<UserProfileProps> = ({ user, onEdit }) => {
	return (
		<div className="user-profile">
			{/* Component content */}
		</div>
	);
};

export default UserProfile;
```

### API Route Structure
```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const userSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const validatedData = userSchema.parse(body);
		
		// Process request
		
		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		return NextResponse.json({
			success: false,
			error: error.message,
		}, { status: 400 });
	}
}
```

## 🧪 Testing

### Testing Framework
- **Jest** for unit testing
- **React Testing Library** for component testing
- **Supertest** for API testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test UserProfile.test.tsx
```

### Writing Tests
```typescript
// __tests__/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import UserProfile from '@/components/UserProfile';

const mockUser = {
	id: '1',
	name: 'John Doe',
	email: 'john@example.com',
};

describe('UserProfile', () => {
	it('renders user information', () => {
		render(<UserProfile user={mockUser} />);
		
		expect(screen.getByText('John Doe')).toBeInTheDocument();
		expect(screen.getByText('john@example.com')).toBeInTheDocument();
	});
});
```

## 📊 Database Schema

### User Model
```typescript
interface User {
	_id: ObjectId;
	email: string;
	name: string;
	profile: {
		bio?: string;
		avatar?: string;
		location?: string;
	};
	skills: {
		teaching: Skill[];
		learning: Skill[];
	};
	verification: {
		email: boolean;
		phone: boolean;
	};
	suspension?: {
		suspended: boolean;
		reason?: string;
		suspendedAt?: Date;
		suspendedBy?: ObjectId;
	};
	createdAt: Date;
	updatedAt: Date;
}
```

### API Endpoints Documentation

All API endpoints follow RESTful conventions and include OpenAPI documentation.

**Authentication Required**: Most endpoints require JWT token in Authorization header.

#### User Endpoints
```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
```

## 🔄 Development Workflow

### Git Workflow
1. **Create feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following coding standards

3. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add user profile editing"
   ```

4. **Push and create Pull Request**

### Code Review Process
- All changes require PR review
- Automated tests must pass
- Code coverage should not decrease
- Documentation should be updated

### Deployment
- **Development**: Auto-deploy from `develop` branch
- **Staging**: Auto-deploy from `main` branch  
- **Production**: Manual deployment after approval

## 🔧 Useful Scripts

```bash
# Database operations
npm run migrate:user-suspension
npm run setup:super-admin
npm run reset:super-admin-password

# Testing
npm run test:admin-api
npm run test:user-suspension
npm run test:email-service

# Development
npm run dev:no-turbo
npm run dev:socket
npm run lint
```

## 📚 Additional Resources

- **[API Documentation](../api/introduction.md)** - Complete API reference
- **[Deployment Guide](./deployment/production.md)** - Production deployment
- **[Architecture Deep Dive](./architecture/overview.md)** - System architecture
- **[Contributing Guidelines](./contributing.md)** - How to contribute

## 🆘 Getting Help

- **GitHub Issues**: Report bugs or request features
- **Developer Discord**: Join our developer community
- **Code Review**: Ask for help in PR comments
- **Documentation**: Submit PRs for doc improvements

---

*Happy coding! 🚀*
