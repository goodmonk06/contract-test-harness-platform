'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { contractSuitesApi, contractRunsApi } from '@/lib/api';

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { data: suite, error, mutate } = useSWR(`/contract-suites/${params.id}`, () =>
    contractSuitesApi.getOne(params.id).then((res) => res.data)
  );

  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await contractRunsApi.execute(params.id);
      // Wait a bit then refresh
      setTimeout(() => {
        mutate();
        setExecuting(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to execute run:', error);
      alert('Failed to execute contract run');
      setExecuting(false);
    }
  };

  if (error) return <div className="text-red-600">Failed to load contract suite</div>;
  if (!suite) return <div>Loading...</div>;

  const config = JSON.parse(suite.configJson);

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href={`/services/${suite.serviceId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Service
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{suite.name}</h1>
            <p className="text-gray-600">{suite.service.name}</p>
            {suite.description && (
              <p className="text-gray-700 mt-2">{suite.description}</p>
            )}
          </div>
          <button
            onClick={handleExecute}
            disabled={executing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {executing ? 'Running...' : 'Run Tests'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-600">Created:</span>{' '}
            <span className="font-medium">
              {new Date(suite.createdAt).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Endpoints:</span>{' '}
            <span className="font-medium">{config.endpointCount || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Runs</h2>
        <div className="space-y-3">
          {suite.runs?.map((run: any) => (
            <Link
              key={run.id}
              href={`/runs/${run.id}`}
              className="block p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        run.status === 'PASSED'
                          ? 'bg-green-100 text-green-800'
                          : run.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : run.status === 'RUNNING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {run.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(run.startedAt).toLocaleString()}
                    </span>
                  </div>
                  {run.summaryJson && (
                    <div className="mt-2 text-sm text-gray-600">
                      {(() => {
                        try {
                          const summary = JSON.parse(run.summaryJson);
                          return `${summary.passed || 0}/${summary.total || 0} tests passed`;
                        } catch {
                          return 'View details';
                        }
                      })()}
                    </div>
                  )}
                </div>
                <span className="text-blue-600">→</span>
              </div>
            </Link>
          ))}
        </div>

        {(!suite.runs || suite.runs.length === 0) && (
          <p className="text-gray-500 text-center py-8">No test runs yet</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>
    </div>
  );
}
