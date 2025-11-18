'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { contractRunsApi } from '@/lib/api';

export default function RunDetailPage({ params }: { params: { id: string } }) {
  const { data: run, error } = useSWR(`/contract-runs/${params.id}`, () =>
    contractRunsApi.getOne(params.id).then((res) => res.data)
  );

  if (error) return <div className="text-red-600">Failed to load run</div>;
  if (!run) return <div>Loading...</div>;

  const summary = run.summaryJson ? JSON.parse(run.summaryJson) : null;

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href={`/contracts/${run.suiteId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Contract Suite
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Run</h1>
        <p className="text-gray-600 mb-4">{run.suite.name}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-gray-600">Status</span>
            <div className="mt-1">
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
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
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Started</span>
            <p className="font-medium">
              {new Date(run.startedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Finished</span>
            <p className="font-medium">
              {run.finishedAt
                ? new Date(run.finishedAt).toLocaleString()
                : 'Running...'}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Duration</span>
            <p className="font-medium">
              {summary?.duration ? `${summary.duration}ms` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {summary && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-3xl font-bold text-blue-600">
                {summary.total || 0}
              </div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-3xl font-bold text-green-600">
                {summary.passed || 0}
              </div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <div className="text-3xl font-bold text-red-600">
                {summary.failed || 0}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          {summary.tests && summary.tests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Test Results</h3>
              <div className="space-y-2">
                {summary.tests.map((test: any, idx: number) => (
                  <div key={idx} className="border rounded p-3">
                    <p className="font-medium">{test.testFilePath || test.name}</p>
                    {test.assertionResults?.map((assertion: any, aIdx: number) => (
                      <div
                        key={aIdx}
                        className={`mt-2 p-2 rounded text-sm ${
                          assertion.status === 'passed'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              assertion.status === 'passed'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {assertion.status === 'passed' ? '✓' : '✗'}
                          </span>
                          <span>{assertion.title || assertion.fullName}</span>
                        </div>
                        {assertion.failureMessages?.length > 0 && (
                          <pre className="mt-2 text-xs text-red-800 overflow-auto">
                            {assertion.failureMessages.join('\n')}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.error && (
            <div className="mt-4 p-4 bg-red-50 rounded">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <pre className="text-sm text-red-700 overflow-auto">
                {summary.error}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Full Summary</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">
          {run.summaryJson || 'No summary available'}
        </pre>
      </div>
    </div>
  );
}
