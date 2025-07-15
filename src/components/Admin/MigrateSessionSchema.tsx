"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function MigrateSessionSchema() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    migrated?: number;
    statusCounts?: Record<string, number>;
    error?: string;
  } | null>(null);

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrate/session-schema');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        error: error instanceof Error ? error.stack : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Session Schema Migration</h2>
      <p className="mb-4 text-gray-600">
        This utility will update the database to fix session schema issues, especially to migrate 
        "canceled" sessions with isAccepted=false to the new "rejected" status with proper user tracking.
      </p>
      
      <Button
        onClick={runMigration}
        disabled={loading}
        className="flex items-center space-x-2"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Running Migration...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            <span>Run Migration</span>
          </>
        )}
      </Button>

      {result && (
        <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start space-x-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
            )}
            <div>
              <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Migration Successful' : 'Migration Failed'}
              </h3>
              <p className="mt-1 text-sm">{result.message}</p>
              
              {result.success && result.statusCounts && (
                <div className="mt-3">
                  <h4 className="font-medium text-sm">Status Counts:</h4>
                  <ul className="mt-1 space-y-1 text-sm">
                    {Object.entries(result.statusCounts).map(([status, count]) => (
                      <li key={status} className="flex justify-between">
                        <span className="capitalize">{status}:</span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {!result.success && result.error && (
                <pre className="mt-3 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                  {result.error}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
