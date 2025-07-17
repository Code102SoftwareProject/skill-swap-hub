# API Documentation

Welcome to the **Skill Swap Hub API Documentation**. This guide covers all available APIs for integrating with and extending the Skill Swap Hub platform.

## Base Information

- **Base URL**: `https://skillswaphub.com/api`
- **API Version**: `v1`
- **Protocol**: HTTPS only
- **Response Format**: JSON

## Authentication

All API requests require authentication using one of the following methods:

### JWT Token Authentication
```http
Authorization: Bearer <your-jwt-token>
```

### API Key Authentication (for admin operations)
```http
X-API-Key: <your-api-key>
```

## Quick Start

1. **[Get API Access](./authentication.md)** - Obtain your API credentials
2. **[Make Your First Request](./users/profile.md)** - Test with a simple API call
3. **[Handle Responses](./errors.md)** - Understand response formats and error handling

## API Categories

### User APIs
Core user-related functionality including registration, authentication, and profile management.

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/users/register` | POST | Register a new user |
| `/users/login` | POST | Authenticate user |
| `/users/profile` | GET | Get user profile |
| `/users/skills` | GET/POST | Manage user skills |

### Admin APIs
Administrative functions for user management and system control.

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/admin/users` | GET | List all users |
| `/admin/users/:id/suspend` | POST | Suspend a user |
| `/admin/reports` | GET | Get system reports |
| `/admin/stats` | GET | Get system statistics |

### Session APIs
Manage learning sessions and video calls.

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/sessions` | POST | Create new session |
| `/sessions/:id` | GET | Get session details |
| `/sessions/:id/join` | POST | Join a session |

## Rate Limits

- **Standard users**: 1000 requests/hour
- **Premium users**: 5000 requests/hour
- **Admin users**: 10000 requests/hour

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Success message",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Error Handling

Error responses include detailed information:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## SDK and Libraries

- **JavaScript/Node.js**: Official SDK available
- **Python**: Community-maintained library
- **PHP**: Community-maintained library

## Support

- **Documentation Issues**: Report on GitHub
- **API Questions**: Contact developer support
- **Status Page**: Check API status and incidents

---

*This documentation is automatically generated from the codebase and updated with each release.*
