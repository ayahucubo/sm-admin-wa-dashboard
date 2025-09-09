import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Read incoming body as text and forward verbatim to webhook (JSON expected)
    let incomingBody = '';
    try {
      incomingBody = await request.text();
    } catch (e) {
      incomingBody = '';
    }
    const hasForwardBody = typeof incomingBody === 'string' && incomingBody.length > 0;

    // Normalize to { body: "..." }
    let normalizedJson: any = undefined;
    if (hasForwardBody) {
      try {
        const parsed = JSON.parse(incomingBody);
        if (parsed && typeof parsed === 'object' && 'body' in parsed) {
          normalizedJson = parsed;
        } else if (typeof parsed === 'string') {
          normalizedJson = { body: parsed };
        } else {
          normalizedJson = { body: String(parsed) };
        }
      } catch {
        normalizedJson = { body: incomingBody };
      }
    }

    // Use the correct webhook URL
    const configuredUrl = "https://wecare.techconnect.co.id/webhook/100/app/api/ButtonActive";
    const candidateUrls: string[] = [configuredUrl];

    console.log('Calling webhook candidates:', candidateUrls, 'forwardBody?', hasForwardBody, 'normalized?', !!normalizedJson);

    const attempts: Array<{
      description: string;
      requestInit: RequestInit;
    }> = [
      {
        description: 'POST with normalized JSON { body }',
        requestInit: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalizedJson ?? { body: "1" })
        }
      }
    ];

    let lastError: any = null;
    for (const url of candidateUrls) {
      for (const attempt of attempts) {
        try {
          console.log('Attempting webhook call:', { url, attempt: attempt.description });
          const resp = await fetch(url, attempt.requestInit);
          const contentType = resp.headers.get('content-type') || '';
          const isJson = contentType.includes('application/json');
          const payload = isJson ? await resp.json().catch(() => ({})) : await resp.text();

          if (resp.ok) {
            return NextResponse.json({
              success: true,
              message: 'Mapping webhook triggered successfully',
              data: payload,
              status: resp.status,
              contentType,
              attempt: attempt.description,
              webhookUrl: url
            }, {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            });
          }
          lastError = { status: resp.status, contentType, payload, attempt: attempt.description, url };
          console.log('Webhook non-OK response:', lastError);
        } catch (err) {
          lastError = { error: err instanceof Error ? err.message : 'Unknown error', attempt: attempt.description, url };
          console.log('Webhook attempt failed:', lastError);
        }
      }
    }

    // Provide a helpful hint if this looks like an inactive n8n production webhook
    const inactiveHint = (lastError && typeof lastError === 'object' && 'payload' in lastError && (lastError as any).payload && (lastError as any).status === 404)
      ? 'n8n returned 404 for the production URL. Ensure the workflow is Active (toggle in top-right) and that the Webhook node path and HTTP method match. The test URL variant was also attempted.'
      : undefined;

    return NextResponse.json({
      success: false,
      error: 'All webhook attempts failed or returned non-OK status',
      details: lastError,
      webhookCandidates: candidateUrls,
      hint: inactiveHint
    }, { status: 502 });
    
  } catch (error) {
    console.error('Error triggering N8N workflow:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      hint: "Please check the webhook URL and ensure it is reachable."
    }, { status: 500 });
  }
}
