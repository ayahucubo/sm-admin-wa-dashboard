/**
 * Utility function for making authenticated API calls
 * Automatically includes JWT token from localStorage in Authorization header
 */

interface AuthenticatedFetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function authenticatedFetch(
  url: string, 
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Utility function for GET requests
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'GET' });
}

/**
 * Utility function for POST requests
 */
export async function authenticatedPost(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Utility function for PUT requests
 */
export async function authenticatedPut(url: string, data: any): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Utility function for DELETE requests
 */
export async function authenticatedDelete(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'DELETE' });
}