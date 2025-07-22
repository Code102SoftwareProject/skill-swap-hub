import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false,
    }
  },
}))

// Mock Next.js navigation (for Next.js 13+ app router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'

// Add Node.js polyfills for browser-like environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Suppress Mongoose Jest warnings
process.env.SUPPRESS_JEST_WARNINGS = 'true';

// Mock global Request and Response for Next.js API routes
global.Request = class MockRequest {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers || {});
    this.body = init.body;
    this._json = null;
    
    // Parse JSON body if provided
    if (init.body && typeof init.body === 'string') {
      try {
        this._json = JSON.parse(init.body);
      } catch (e) {
        // Invalid JSON will throw during json() call
      }
    }
  }

  async json() {
    if (this._json !== null) {
      return this._json;
    }
    
    if (this.body && typeof this.body === 'string') {
      try {
        return JSON.parse(this.body);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
    
    throw new Error('No JSON body');
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers || {});
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
}

// Mock Headers class
global.Headers = class MockHeaders {
  constructor(init = {}) {
    this.entries = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.entries.set(key.toLowerCase(), value);
      });
    }
  }

  get(name) {
    return this.entries.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this.entries.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.entries.has(name.toLowerCase());
  }

  delete(name) {
    return this.entries.delete(name.toLowerCase());
  }
}

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body, init = {}) => {
      const response = new Response(JSON.stringify(body), {
        status: init.status || 200,
        statusText: init.statusText || 'OK',
        headers: {
          'content-type': 'application/json',
          ...init.headers
        }
      });
      return response;
    }
  }
}));
