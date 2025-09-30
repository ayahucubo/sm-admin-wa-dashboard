import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';

// Available menu options based on actual database values
const MENU_OPTIONS = [
  'Industrial Relation',
  'Jeanny', 
  'Benefit',
  'Peraturan Perusahaan',
  'Promosi',
  'Cuti',
  'Data Cuti'
];

// GET - Fetch available menu options for filtering
export async function GET(request: NextRequest) {
  try {
    console.log('Menu options API called');
    
    // Check authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult) {
      console.log('⚠️ Authentication failed for menu options');
      return createUnauthorizedResponse('Access denied. Please login to view menu options.');
    }

    console.log(`✅ Authenticated admin requesting menu options: ${authResult.email}`);

    return NextResponse.json({
      success: true,
      data: MENU_OPTIONS,
      count: MENU_OPTIONS.length
    });

  } catch (error) {
    console.error('💥 Menu options API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch menu options',
      data: [],
      count: 0
    }, { status: 500 });
  }
}

// OPTIONS - Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
