import { NextRequest, NextResponse } from 'next/server';
import { 
  getCCBenefitMappingData, 
  createCCBenefitMapping, 
  updateCCBenefitMapping, 
  deleteCCBenefitMapping,
  getCCBenefitMappingSchema 
} from '@/utils/database';
import { authenticateAdmin, createUnauthorizedResponse } from '@/utils/auth';

// GET - Fetch all records or schema (PROTECTED)
export async function GET(request: NextRequest) {
  try {
    console.log('CC Benefit Mapping GET request received');
    
    // Check authentication first
    const authPayload = await authenticateAdmin(request);
    if (!authPayload) {
      console.log('⚠️ Unauthorized access attempt blocked');
      return createUnauthorizedResponse('Access denied. Please login to view this data.');
    }
    
    console.log(`✅ Authenticated admin: ${authPayload.email}`);
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'schema') {
      console.log('Fetching table schema...');
      const schema = await getCCBenefitMappingSchema();
      return NextResponse.json({ 
        success: true, 
        schema: schema 
      });
    }
    
    console.log('Fetching CC benefit mapping data...');
    const data = await getCCBenefitMappingData();
    console.log(`Successfully fetched ${data.length} records`);
    
    return NextResponse.json({ 
      success: true, 
      data: data,
      count: data.length 
    });
  } catch (error) {
    console.error('API GET Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check database connection and table existence',
      data: []
    }, { status: 500 });
  }
}

// POST - Create new record (PROTECTED)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authPayload = await authenticateAdmin(request);
    if (!authPayload) {
      console.log('⚠️ Unauthorized POST attempt blocked');
      return createUnauthorizedResponse();
    }
    
    console.log(`✅ Authenticated admin creating record: ${authPayload.email}`);
    
    const body = await request.json();
    const newRecord = await createCCBenefitMapping(body);
    
    return NextResponse.json({ 
      success: true, 
      data: newRecord,
      message: 'Record created successfully'
    });
  } catch (error) {
    console.error('API POST Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create record'
    }, { status: 500 });
  }
}

// PUT - Update existing record (PROTECTED)
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const authPayload = await authenticateAdmin(request);
    if (!authPayload) {
      console.log('⚠️ Unauthorized PUT attempt blocked');
      return createUnauthorizedResponse();
    }
    
    console.log(`✅ Authenticated admin updating record: ${authPayload.email}`);
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Record ID is required for update'
      }, { status: 400 });
    }
    
    const updatedRecord = await updateCCBenefitMapping(id, updateData);
    
    if (!updatedRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedRecord,
      message: 'Record updated successfully'
    });
  } catch (error) {
    console.error('API PUT Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update record'
    }, { status: 500 });
  }
}

// DELETE - Delete record (PROTECTED)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authPayload = await authenticateAdmin(request);
    if (!authPayload) {
      console.log('⚠️ Unauthorized DELETE attempt blocked');
      return createUnauthorizedResponse();
    }
    
    console.log(`✅ Authenticated admin deleting record: ${authPayload.email}`);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Record ID is required for deletion'
      }, { status: 400 });
    }
    
    const deletedRecord = await deleteCCBenefitMapping(parseInt(id));
    
    if (!deletedRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: deletedRecord,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete record'
    }, { status: 500 });
  }
}

// OPTIONS - Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
