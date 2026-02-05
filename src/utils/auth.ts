import { NextRequest } from 'next/server';

// Admin credentials (in production, store password as hash)
const ADMIN_CREDENTIALS = [
  {
    email: 'admin@sinarmasmining.com',
    password: 'admin123', // In production, this should be hashed
    role: 'admin'
  },
  {
    email: 'benefitadmin@sinarmasmining.com',
    password: 'bnft_1209', // In production, this should be hashed
    role: 'benefit_admin'
  }
];

// API Keys for external access (in production, store in database with metadata)
const VALID_API_KEYS = [
  {
    key: 'smm-api-key-admin-2024',
    name: 'Admin API Key',
    role: 'api_admin',
    permissions: ['read', 'write', 'delete'],
    createdAt: '2024-01-01',
    lastUsed: null,
    isActive: true
  },
  {
    key: 'smm-api-key-readonly-2024',
    name: 'Read Only API Key', 
    role: 'api_readonly',
    permissions: ['read'],
    createdAt: '2024-01-01',
    lastUsed: null,
    isActive: true
  }
];

// Load API keys from environment variables (both development and production)
let ENVIRONMENT_LOADED = false;

function loadEnvironmentKeys() {
  if (ENVIRONMENT_LOADED) return;
  
  try {
    const isApiKeyAuthEnabled = process.env.ENABLE_API_KEY_AUTH === 'true';

    if (isApiKeyAuthEnabled) {
      const envApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
      
      envApiKeys.forEach((key, index) => {
        if (key && key.trim()) {
          const isProduction = process.env.NODE_ENV === 'production';
          VALID_API_KEYS.push({
            key: key.trim(),
            name: isProduction ? `Production API Key ${index + 1}` : `Development API Key ${index + 1}`,
            role: 'api_admin',
            permissions: ['read', 'write', 'delete'],
            createdAt: new Date().toISOString(),
            lastUsed: null,
            isActive: true
          });
        }
      });
    }
    
    ENVIRONMENT_LOADED = true;
  } catch (error) {
    console.error('Error loading environment keys:', error);
    ENVIRONMENT_LOADED = true; // Don't retry
  }
}

// Load environment keys when module is imported
loadEnvironmentKeys();

export interface AuthPayload {
  email: string;
  role: string;
  iat: number;
  exp?: number; // Optional - some JWT tokens might not include expiration
}

export interface ApiKeyPayload {
  key: string;
  name: string;
  role: string;
  permissions: string[];
  iat: number;
  exp?: number;
  keyId: string;
}

/**
 * Verify API key credentials
 */
export function verifyApiKey(apiKey: string): ApiKeyPayload | null {
  try {
    // Ensure environment keys are loaded
    loadEnvironmentKeys();
    
    const validKey = VALID_API_KEYS.find(k => k.key === apiKey && k.isActive);
    
    if (!validKey) {
      return null;
    }
    
    const payload: ApiKeyPayload = {
      key: validKey.key,
      name: validKey.name,
      role: validKey.role,
      permissions: validKey.permissions,
      iat: Math.floor(Date.now() / 1000),
      keyId: validKey.key.substring(0, 8) // Use first 8 chars as ID
    };
    
    return payload;
  } catch (error) {
    console.error('API key verification failed:', error);
    return null;
  }
}

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(email: string, password: string): { isValid: boolean; role?: string } {
  const user = ADMIN_CREDENTIALS.find(cred => cred.email === email && cred.password === password);
  return user ? { isValid: true, role: user.role } : { isValid: false };
}

/**
 * Generate simple JWT-like token
 */
export function generateToken(email: string, role: string): string {
  const payload: AuthPayload = {
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiry
  };
  
  // Simple base64 encoding (in production, use proper JWT library)
  const tokenData = JSON.stringify(payload);
  return Buffer.from(tokenData).toString('base64');
}

/**
 * Verify and decode token (server-side)
 */
export function verifyToken(token: string): AuthPayload | null {
  try {    
    // Check if this is a JWT token (3 parts separated by dots)
    if (token.includes('.')) {      
      // Split JWT token and decode the payload (second part)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      // Decode the payload (second part of JWT)
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      const decodedBytes = Buffer.from(paddedPayload, 'base64').toString('utf-8');
      const decoded = JSON.parse(decodedBytes) as any;
      
      // Convert JWT claims to AuthPayload format
      const authPayload: AuthPayload = {
        email: decoded.email || '',
        role: decoded.role || 'user',
        iat: decoded.iat || Math.floor(Date.now() / 1000),
        exp: decoded.exp
      };
      
      // Role differentiation: Since N8N gives everyone "admin" role,
      // differentiate based on email address
      if (authPayload.email === 'benefitadmin@sinarmasmining.com') {
        authPayload.role = 'benefit_admin';
      } else if (authPayload.email === 'hris@sinarmasmining.com' || 
                authPayload.email === 'admin@sinarmasmining.com') {
        authPayload.role = 'admin';
      }
      
      // Validate required fields
      if (!authPayload.email || !authPayload.iat) {
        return null;
      }
      
      // Check if token is expired (if exp field exists)
      if (authPayload.exp && authPayload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return authPayload;
    } else {      
      // Check if token looks like base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(token)) {
        return null;
      }
      
      const decodedBytes = Buffer.from(token, 'base64').toString('utf-8');
      const decoded = JSON.parse(decodedBytes) as AuthPayload;
      
      // Validate required fields
      if (!decoded.email || !decoded.role || !decoded.iat) {
        return null;
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decoded;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header (supports both Bearer token and API key)
 */
export function getTokenFromRequest(request: NextRequest): { token: string; type: 'bearer' | 'apikey' } | null {
  const authHeader = request.headers.get('Authorization');
  const apiKeyHeader = request.headers.get('X-API-Key');
  
  // Check for API key in X-API-Key header first
  if (apiKeyHeader) {
    return { token: apiKeyHeader, type: 'apikey' };
  }
  
  // Check for Bearer token in Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Determine if this is an API key (not JWT format) or admin token
    if (!token.includes('.') && (token.startsWith('smm-api-key-') || token.startsWith('smm-prod-') || token.startsWith('smm-dev-'))) {
      return { token, type: 'apikey' };
    }
    
    return { token, type: 'bearer' };
  }
  
  return null;
}

/**
 * Authenticate request with support for both admin tokens and API keys
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredPermissions?: string[]
): Promise<{ payload: AuthPayload | ApiKeyPayload; type: 'admin' | 'apikey' } | null> {
  const authData = getTokenFromRequest(request);
  
  if (!authData) {
    console.log('No authentication token found in request');
    return null;
  }
  
  if (authData.type === 'apikey') {
    console.log('Attempting API key authentication...');
    const apiPayload = verifyApiKey(authData.token);
    
    if (!apiPayload) {
      console.log('API key verification failed');
      return null;
    }
    
    // Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => 
        apiPayload.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        console.log('API key lacks required permissions:', requiredPermissions);
        return null;
      }
    }
    
    console.log('API key authenticated successfully:', apiPayload.name);
    return { payload: apiPayload, type: 'apikey' };
  } else {
    console.log('Attempting admin token authentication...');
    const adminPayload = verifyToken(authData.token);
    
    if (!adminPayload) {
      console.log('Admin token verification failed');
      return null;
    }
    
    if (adminPayload.role !== 'admin' && adminPayload.role !== 'benefit_admin') {
      console.log('User role is not authorized:', adminPayload.role);
      return null;
    }
    
    console.log('Admin authenticated successfully:', adminPayload.email, 'Role:', adminPayload.role);
    return { payload: adminPayload, type: 'admin' };
  }
}

/**
 * Extract token from Authorization header (legacy function - kept for backward compatibility)
 */
export function getTokenFromRequest_Legacy(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Authenticate admin user (legacy function - maintained for backward compatibility)
 */
export async function authenticateAdmin(request: NextRequest): Promise<AuthPayload | null> {
  // First try the new authentication system
  const authResult = await authenticateRequest(request);
  
  if (authResult) {
    if (authResult.type === 'admin') {
      return authResult.payload as AuthPayload;
    } else {
      // For API keys, create a compatible AuthPayload
      const apiPayload = authResult.payload as ApiKeyPayload;
      return {
        email: `api-user-${apiPayload.keyId}@system.local`,
        role: apiPayload.role,
        iat: apiPayload.iat,
        exp: apiPayload.exp
      };
    }
  }
  
  // Fallback to legacy method
  const token = getTokenFromRequest_Legacy(request);
  
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
  
  if (payload.role !== 'admin' && payload.role !== 'benefit_admin') {
    console.log('User role is not authorized:', payload.role);
    return null;
  }
  
  console.log('User authenticated successfully:', payload.email, 'Role:', payload.role);
  return payload;
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized. Please login to access this resource.') {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
    authMethods: {
      adminToken: 'Use Authorization: Bearer <admin-token> header',
      apiKey: 'Use X-API-Key: <api-key> header or Authorization: Bearer <api-key>'
    }
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': 'Bearer, API-Key'
    },
  });
}

/**
 * Create forbidden response for insufficient permissions
 */
export function createForbiddenResponse(message: string = 'Insufficient permissions to access this resource.') {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    code: 'FORBIDDEN'
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Decode token on client side (for React components)
 * Handles both JWT tokens from N8N and simple base64 tokens
 */
export function decodeClientToken(token: string): AuthPayload | null {
  try {
    // Check if this is a JWT token (3 parts separated by dots)
    if (token.includes('.')) {
      // Split JWT token and decode the payload (second part)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      // Decode the payload (second part of JWT)
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      const decodedBytes = atob(paddedPayload); // Use atob for client-side
      const decoded = JSON.parse(decodedBytes) as any;
      
      // Convert JWT claims to AuthPayload format
      const authPayload: AuthPayload = {
        email: decoded.email,
        role: decoded.role,
        iat: decoded.iat || Math.floor(Date.now() / 1000),
        exp: decoded.exp
      };
      
      // Role differentiation: Since N8N gives everyone "admin" role,
      // differentiate based on email address
      if (authPayload.email === 'benefitadmin@sinarmasmining.com') {
        authPayload.role = 'benefit_admin';
      } else if (authPayload.email === 'hris@sinarmasmining.com' || 
                authPayload.email === 'admin@sinarmasmining.com') {
        authPayload.role = 'admin';
      }
      
      console.log('JWT token decoded:', authPayload);
      
      // Validate required fields
      if (!authPayload.email || !authPayload.role || !authPayload.iat) {
        return null;
      }
      
      // Check if token is expired (if exp field exists)
      if (authPayload.exp && authPayload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return authPayload;
    } else {
      // Simple base64 token format (fallback)
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(token)) {
        return null;
      }
      
      const decodedBytes = atob(token); // Use atob for client-side
      const decoded = JSON.parse(decodedBytes) as AuthPayload;
      
      // Validate required fields
      if (!decoded.email || !decoded.role || !decoded.iat) {
        return null;
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return decoded;
    }
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}