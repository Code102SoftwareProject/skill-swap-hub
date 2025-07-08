const jwt = require('jsonwebtoken');

// Function to decode JWT token without verification (for debugging)
function decodeTokenDebug(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

console.log('JWT Token Debug Tool');
console.log('====================');
console.log('');
console.log('To use this tool:');
console.log('1. Open your browser developer tools');
console.log('2. Go to Application/Storage > Cookies');
console.log('3. Find the "adminToken" cookie value');
console.log('4. Run: node scripts/checkJWTToken.js "YOUR_TOKEN_HERE"');
console.log('');

const token = process.argv[2];

if (!token) {
  console.log('Please provide a JWT token as an argument.');
  console.log('Usage: node scripts/checkJWTToken.js "your-jwt-token-here"');
  process.exit(1);
}

const decoded = decodeTokenDebug(token);

if (decoded) {
  console.log('Decoded JWT Token:');
  console.log('==================');
  console.log('Header:', JSON.stringify(decoded.header, null, 2));
  console.log('Payload:', JSON.stringify(decoded.payload, null, 2));
  console.log('');
  console.log('Admin Details:');
  console.log('- Username:', decoded.payload.username);
  console.log('- Role:', decoded.payload.role);
  console.log('- Permissions:', decoded.payload.permissions?.join(', ') || 'None');
  console.log('- Has manage_success_stories:', decoded.payload.permissions?.includes('manage_success_stories') ? 'YES' : 'NO');
  console.log('- Token issued at:', new Date(decoded.payload.iat * 1000));
  console.log('- Token expires at:', new Date(decoded.payload.exp * 1000));
} else {
  console.log('Failed to decode token.');
}
