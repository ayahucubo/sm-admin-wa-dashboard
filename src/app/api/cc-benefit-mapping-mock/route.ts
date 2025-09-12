import { NextResponse } from 'next/server';

// Mock data for CC benefit mapping
const mockCCBenefitData = [
  {
    id: 1,
    creditCard: "Premium Gold Card",
    benefit: "Airport Lounge Access",
    description: "Complimentary access to premium airport lounges worldwide",
    category: "Travel"
  },
  {
    id: 2,
    creditCard: "Platinum Rewards Card",
    benefit: "Cashback Rewards",
    description: "Up to 5% cashback on selected categories",
    category: "Rewards"
  },
  {
    id: 3,
    creditCard: "Travel Elite Card",
    benefit: "Travel Insurance",
    description: "Comprehensive travel insurance coverage",
    category: "Insurance"
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockCCBenefitData,
      message: "Mock CC benefit mapping data retrieved successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to retrieve mock data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate adding new CC benefit mapping
    const newMapping = {
      id: mockCCBenefitData.length + 1,
      ...body,
      createdAt: new Date().toISOString()
    };
    
    mockCCBenefitData.push(newMapping);
    
    return NextResponse.json({
      success: true,
      data: newMapping,
      message: "Mock CC benefit mapping added successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to add mock mapping",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}