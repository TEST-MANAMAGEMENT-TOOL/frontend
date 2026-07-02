import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bugBashFunctionalService } from '@/services/bugBashFunctionalService';

/**
 * Test component to verify bug fetching from API
 * Usage: Add this component to any page to test the API
 */
export function BugFetchTest() {
  const [bugBashId, setBugBashId] = useState('7');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing bug fetch for bug bash ID:', bugBashId);
      const response = await bugBashFunctionalService.getBugsByBugBashId(bugBashId);
      console.log('✅ Test successful:', response);
      setResult(response);
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Bug Fetch API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={bugBashId}
            onChange={(e) => setBugBashId(e.target.value)}
            placeholder="Enter Bug Bash ID"
            className="flex-1"
          />
          <Button onClick={testFetch} disabled={loading || !bugBashId}>
            {loading ? 'Testing...' : 'Test Fetch'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">
              Success! Found {result.bugs?.length || 0} bugs
            </h3>
            <div className="mt-2">
              <p className="text-sm text-green-700 mb-2">Message: {result.message}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-green-800">
                  View Raw Response
                </summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter a valid Bug Bash ID (default is 7)</li>
            <li>Click "Test Fetch" button</li>
            <li>Check the browser console for detailed logs</li>
            <li>View the result or error message above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
