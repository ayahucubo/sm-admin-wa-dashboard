import { NextRequest } from 'next/server';

// Admin credentials (in production, store password as hash)
const ADMIN_CREDENTIALS = {
  email: 'hris@sinarmasmining.com',
  password: 'Hr152019!', // In production, this should be hashed
  role: 'admin'
};

export interface AuthPayload {
  email: string;
  role: string;
  iat: number;
  exp?: number; // Optional - some JWT tokens might not include expiration
}

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

/**
 * Generate simple JWT-like token
 */
export function generateToken(email: string): string {
  const payload: AuthPayload = {
    email,
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiry
  };
  
  // Simple base64 encoding (in production, use proper JWT library)
  const tokenData = JSON.stringify(payload);
  return Buffer.from(tokenData).toString('base64');
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    console.log('Verifying token:', token.substring(0, 50) + '...');
    
    // Check if this is a JWT token (3 parts separated by dots)
    if (token.includes('.')) {
      console.log('Detected JWT format token');
      
      // Split JWT token and decode the payload (second part)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid JWT format - must have 3 parts');
        return null;
      }
      
      // Decode the payload (second part of JWT)
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      const decodedBytes = Buffer.from(paddedPayload, 'base64').toString('utf-8');
      console.log('Decoded JWT payload:', decodedBytes);
      
      const decoded = JSON.parse(decodedBytes) as AuthPayload;
      
      // Validate required fields
      if (!decoded.email || !decoded.role || !decoded.iat) {
        console.log('JWT token missing required fields');
        return null;
      }
      
      // Check if token is expired (if exp field exists)
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        console.log('JWT token expired');
        return null;
      }
      
      console.log('JWT token verified successfully for:', decoded.email);
      return decoded;
    } else {
      console.log('Detected simple base64 token format');
      
      // Check if token looks like base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(token)) {
        console.log('Token is not valid base64');
        return null;
      }
      
      const decodedBytes = Buffer.from(token, 'base64').toString('utf-8');
      console.log('Decoded token string:', decodedBytes);
      
      // Try to parse as JSON
      const decoded = JSON.parse(decodedBytes) as AuthPayload;
      
      // Validate required fields
      if (!decoded.email || !decoded.role || !decoded.iat || !decoded.exp) {
        console.log('Token missing required fields');
        return null;
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        console.log('Token expired');
        return null;
      }
      
      console.log('Simple token verified successfully for:', decoded.email);
      return decoded;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    console.log('Token that failed:', token);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Authenticate admin user
 */
export async function authenticateAdmin(request: NextRequest): Promise<AuthPayload | null> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    console.log('No token found in request');
    return null;
  }
  
  console.log('Token found, verifying...');
  const payload = verifyToken(token);
  
  if (!payload) {
    console.log('Token verification failed');
    return null;
  }
  
  if (payload.role !== 'admin') {
    console.log('User role is not admin:', payload.role);
    return null;
  }
  
  console.log('Admin authenticated successfully:', payload.email);
  return payload;
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized. Please login to access this resource.') {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    code: 'UNAUTHORIZED'
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}