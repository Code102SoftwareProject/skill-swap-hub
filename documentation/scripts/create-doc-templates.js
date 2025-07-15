#!/usr/bin/env node

/**
 * Documentation Template Generator
 * 
 * This script creates template documentation files based on your project structure
 * and existing API routes.
 */

const fs = require('fs');
const path = require('path');

const docsPath = path.join(__dirname, '../docs');

// Template generators
const templates = {
  userGuide: {
    'account/login.md': `# User Login

Guide for logging into your Skill Swap Hub account.

## Login Methods
- Email and password
- Google OAuth
- GitHub OAuth

## Troubleshooting
- Forgot password
- Account locked
- OAuth issues
`,
    'account/profile-setup.md': `# Profile Setup

Complete guide to setting up your user profile.

## Basic Information
- Profile picture
- Personal details
- Bio and description

## Skills Configuration
- Teaching skills
- Learning interests
- Experience levels

## Privacy Settings
- Profile visibility
- Contact preferences
- Data sharing options
`,
    'features/skill-matching.md': `# Skill Matching

Learn how the skill matching algorithm works.

## How Matching Works
- Algorithm explanation
- Compatibility factors
- Location preferences

## Finding Matches
- Search filters
- Browse suggestions
- Advanced search

## Connection Process
- Sending requests
- Accepting connections
- Starting conversations
`,
    'troubleshooting.md': `# Troubleshooting

Common issues and solutions.

## Account Issues
- Login problems
- Profile issues
- Verification problems

## Technical Issues
- Browser compatibility
- Performance issues
- Mobile app problems

## Contact Support
- In-app help
- Email support
- Emergency contacts
`,
    'faq.md': `# Frequently Asked Questions

Common questions about Skill Swap Hub.

## Account & Registration
### How do I create an account?
### How do I verify my email?
### Can I use multiple login methods?

## Skill Matching
### How does the matching algorithm work?
### Can I filter matches by location?
### How do I improve my match quality?

## Safety & Security
### How do I report inappropriate behavior?
### Is my personal information safe?
### Can I block users?

## Technical Support
### What browsers are supported?
### Is there a mobile app?
### How do I update my profile?
`
  },
  
  apiDocs: {
    'authentication.md': `# API Authentication

Learn how to authenticate with the Skill Swap Hub API.

## Authentication Methods

### JWT Token Authentication
\`\`\`http
Authorization: Bearer <your-jwt-token>
\`\`\`

### API Key Authentication
\`\`\`http
X-API-Key: <your-api-key>
\`\`\`

## Getting Started
1. Register for API access
2. Obtain your credentials
3. Make your first authenticated request

## Token Management
- Token expiration
- Refresh tokens
- Security best practices
`,
    'users/registration.md': `# User Registration API

API endpoints for user registration.

## POST /api/users/register

Register a new user account.

### Request Body
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
\`\`\`

### Response
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt-token-here"
  }
}
\`\`\`

### Error Responses
- 400: Validation error
- 409: User already exists
- 500: Server error
`,
    'errors.md': `# API Error Handling

Understanding API error responses and codes.

## Error Response Format
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
\`\`\`

## Common Error Codes
- \`VALIDATION_ERROR\`: Invalid input data
- \`UNAUTHORIZED\`: Authentication required
- \`FORBIDDEN\`: Insufficient permissions
- \`NOT_FOUND\`: Resource not found
- \`RATE_LIMIT_EXCEEDED\`: Too many requests

## HTTP Status Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limited
- 500: Internal Server Error
`
  }
};

// Create directories and files
function createTemplateFiles() {
  console.log('🚀 Creating documentation template files...\n');
  
  Object.keys(templates).forEach(section => {
    const sectionPath = path.join(docsPath, section.replace(/([A-Z])/g, '-$1').toLowerCase());
    
    Object.keys(templates[section]).forEach(filePath => {
      const fullPath = path.join(sectionPath, filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
      
      // Create file if it doesn't exist
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, templates[section][filePath]);
        console.log(`📄 Created file: ${fullPath}`);
      } else {
        console.log(`⏭️  Skipped existing file: ${fullPath}`);
      }
    });
  });
  
  console.log('\n✅ Template files created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Customize the template content for your project');
  console.log('2. Add these files to your sidebar configuration');
  console.log('3. Run "npm run dev" to see the updated documentation');
}

// Main execution
if (require.main === module) {
  createTemplateFiles();
}

module.exports = { createTemplateFiles, templates };
