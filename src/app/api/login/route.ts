import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, generateToken } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email dan password harus diisi',
        error: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Verify credentials
    if (!verifyAdminCredentials(email, password)) {
      console.log(`Failed login attempt: ${email}`);
      return NextResponse.json({
        success: false,
        message: 'Email atau password salah',
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Generate token
    const token = generateToken(email);
    
    console.log(`Successful login: ${email}`);
    
    return NextResponse.json({
      success: true,
      token,
      message: 'Login berhasil',
      user: {
        email,
        role: 'admin'
      }
    });
    
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan sistem',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}