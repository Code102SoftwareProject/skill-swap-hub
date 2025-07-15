#!/usr/bin/env node

/**
 * API Documentation Generator
 * 
 * This script scans the Next.js API routes and generates OpenAPI documentation
 * automatically from JSDoc comments in your API files.
 */

const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

// Configuration for swagger-jsdoc
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Skill Swap Hub API',
    version: '1.0.0',
    description: 'Complete API documentation for Skill Swap Hub platform',
    contact: {
      name: 'API Support',
      email: 'support@skillswaphub.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
    {
      url: 'https://skillswaphub.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
    {
      apiKeyAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: [
    '../src/app/api/**/*.ts',
    '../src/app/api/**/*.js',
    './docs/api/**/*.md',
  ],
};

// Generate the specification
const specs = swaggerJSDoc(options);

// Write the specification to a file
const outputPath = path.join(__dirname, '../docs/api/openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));

console.log('✅ OpenAPI specification generated at:', outputPath);

// Also generate a YAML version
const yaml = require('js-yaml');
const yamlStr = yaml.dump(specs);
const yamlOutputPath = path.join(__dirname, '../docs/api/openapi.yaml');
fs.writeFileSync(yamlOutputPath, yamlStr);

console.log('✅ OpenAPI YAML specification generated at:', yamlOutputPath);

console.log(`
📚 Next steps:
1. Add JSDoc comments to your API routes following OpenAPI format
2. Run 'npm run build:docs' to generate the documentation
3. View your docs at http://localhost:3000/docs

Example JSDoc comment for an API route:

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
`);
