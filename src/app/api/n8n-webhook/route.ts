import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Try different possible webhook URL formats
    const possibleUrls = [
      "https://wecare.techconnect.co.id/webhook/n8n_mapping_sme_cb_cc_benefit_del",
      "https://wecare.techconnect.co.id/webhook/4RQEjkIfzQhxPB5Y",
      "https://wecare.techconnect.co.id/webhook/cc-benefit-mapping",
      "https://wecare.techconnect.co.id/webhook/mapping-cc-benefit"
    ];
    
    let lastError = null;
    
    for (const n8nWebhookUrl of possibleUrls) {
      try {
        console.log('Trying N8N webhook URL:', n8nWebhookUrl);
        
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trigger: 'manual',
            timestamp: new Date().toISOString(),
            source: 'admin-dashboard',
            workflow: 'n8n_mapping_sme_cb_cc_benefit_del'
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('N8N workflow triggered successfully:', result);
          
          return NextResponse.json({
            success: true,
            message: 'N8N mapping workflow started successfully',
            data: result,
            webhookUrl: n8nWebhookUrl
          });
        } else {
          const errorText = await response.text();
          console.log(`Failed with URL ${n8nWebhookUrl}:`, response.status, errorText);
          lastError = { status: response.status, error: errorText, url: n8nWebhookUrl };
        }
      } catch (error) {
        console.log(`Error with URL ${n8nWebhookUrl}:`, error);
        lastError = { error: error instanceof Error ? error.message : 'Unknown error', url: n8nWebhookUrl };
      }
    }
    
    // If webhooks failed, try using N8N REST API
    console.log('Webhooks failed, trying N8N REST API...');
    
    try {
      const workflowId = "4RQEjkIfzQhxPB5Y";
      const n8nApiUrl = `https://wecare.techconnect.co.id/rest/workflows/${workflowId}/trigger`;
      
      console.log('Trying N8N REST API:', n8nApiUrl);
      
      const apiResponse = await fetch(n8nApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'manual',
          timestamp: new Date().toISOString(),
          source: 'admin-dashboard'
        })
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('N8N workflow triggered successfully via API:', result);
        
        return NextResponse.json({
          success: true,
          message: 'N8N mapping workflow started successfully via REST API',
          data: result,
          method: 'REST API',
          workflowId: workflowId
        });
      } else {
        const errorText = await apiResponse.text();
        console.log('N8N REST API failed:', apiResponse.status, errorText);
        lastError = { status: apiResponse.status, error: errorText, method: 'REST API' };
      }
    } catch (apiError) {
      console.log('N8N REST API error:', apiError);
      lastError = { error: apiError instanceof Error ? apiError.message : 'Unknown API error', method: 'REST API' };
    }
    
    // If all methods failed, return the last error
    console.error('All methods failed:', lastError);
    
    return NextResponse.json({
      success: false,
      error: `All webhook URLs and REST API failed. Last error: ${lastError?.error || 'Unknown error'}`,
      details: lastError,
      hint: "Please ensure the N8N workflow is activated and check the workflow toggle in the top-right corner of the N8N editor. Also verify the webhook configuration in the first node of your workflow."
    }, { status: 404 });
    
  } catch (error) {
    console.error('Error triggering N8N workflow:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      hint: "Please check your N8N workflow configuration and ensure it's activated."
    }, { status: 500 });
  }
}
