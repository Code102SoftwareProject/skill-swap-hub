import jwt from "jsonwebtoken";

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Check if JWT_SECRET is properly configured
if (!JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
}

/**
 * Verifies a JWT token's validity
 * @param token - The JWT token string to verify
 * @returns Promise resolving to boolean indicating if token is valid
 */
export function verifyJWT(token: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (!JWT_SECRET) {
        resolve(false);
        return;
      }
      jwt.verify(token, JWT_SECRET);
      resolve(true);
    } catch {
      // Token is invalid or expired
      resolve(false);
    }
  });
}

/**
 * Creates a new JWT token with the provided payload
 * @param payload - Data to be encoded in the JWT
 * @returns JWT token string that expires in 1 day
 */
export function createJWT(payload: object): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
