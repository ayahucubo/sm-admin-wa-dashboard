"use client";
import { useState } from "react";
import { getApiPath } from '@/utils/api';

export default function TestSheetsPage() {
  const [sheetId, setSheetId] = useState("2PACX-1vS0mDV9rxyyDEtW61ZT07q6IVUV_P17sOej5jB-GpJb8Yg3RGpxvh_tdeD8_56FTJEUIkwn9B8xn93_");
  const [range, setRange] = useState("A:F");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testSheet = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(getApiPath(`api/sheets?sheetId=${sheetId}&range=${range}`));
      const data = await response.json();

      if (!response.ok) {
        setError(data.details || data.error || 'Unknown error');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const testDirectUrls = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const urls = [
      `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv&gid=333075918`,
      `https://docs.google.com/spreadsheets/d/e/${sheetId}/gviz/tq?tqx=out:csv&gid=333075918`,
      `https://docs.google.com/spreadsheets/d/e/${sheetId}/export?format=csv&gid=333075918`
    ];

    const results = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        const response = await fetch(urls[i], {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        results.push({
          url: urls[i],
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentLength: response.headers.get('content-length'),
          contentType: response.headers.get('content-type')
        });
      } catch (err) {
        results.push({
          url: urls[i],
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    setResult({ directUrlTests: results });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Google Sheets API Test
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sheet ID
              </label>
              <input
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter Google Sheet ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Range
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., A:F"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={testSheet}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API Route'}
            </button>
            
            <button
              onClick={testDirectUrls}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Direct URLs'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Troubleshooting Tips
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Make sure the Google Sheet is published to the web</li>
            <li>• Check that the sheet ID is correct (extract from the URL)</li>
            <li>• Ensure the sheet has proper permissions (anyone with link can view)</li>
            <li>• Try accessing the sheet URL directly in a browser</li>
            <li>• The sheet should contain data in the specified range</li>
            <li>• Verify the gid parameter matches your sheet tab (currently set to 333075918)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
