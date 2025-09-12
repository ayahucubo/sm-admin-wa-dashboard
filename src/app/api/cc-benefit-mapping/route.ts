import { NextRequest, NextResponse } from 'next/server';
import { 
  getCCBenefitMappingData, 
  createCCBenefitMapping, 
  updateCCBenefitMapping, 
  deleteCCBenefitMapping,
  getCCBenefitMappingSchema 
} from '@/utils/database';

// GET - Fetch all records or schema
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'schema') {
      const schema = await getCCBenefitMappingSchema();
      return NextResponse.json({ 
        success: true, 
        schema: schema 
      });
    }
    
    const data = await getCCBenefitMappingData();
    return NextResponse.json({ 
      success: true, 
      data: data,
      count: data.length 
    });
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }, { status: 500 });
  }
}

// POST - Create new record
export async function POST(request: NextRequest) {
  try {
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

// PUT - Update existing record
export async function PUT(request: NextRequest) {
  try {
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

// DELETE - Delete record
export async function DELETE(request: NextRequest) {
  try {
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
