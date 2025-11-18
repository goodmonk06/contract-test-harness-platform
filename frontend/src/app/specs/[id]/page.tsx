'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiSpecsApi, contractSuitesApi } from '@/lib/api';

export default function SpecDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: spec, error } = useSWR(`/api-specs/${params.id}`, () =>
    apiSpecsApi.getOne(params.id).then((res) => res.data)
  );

  const { data: parsedSpec } = useSWR(`/api-specs/${params.id}/parsed`, () =>
    apiSpecsApi.getParsed(params.id).then((res) => res.data)
  );

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!spec) return;

    setGenerating(true);
    try {
      const result = await contractSuitesApi.generate({
        serviceId: spec.serviceId,
        apiSpecId: spec.id,
      });
      router.push(`/contracts/${result.data.id}`);
    } catch (error) {
      console.error('Failed to generate suite:', error);
      alert('Failed to generate contract suite');
    } finally {
      setGenerating(false);
    }
  };

  if (error) return <div className="text-red-600">Failed to load spec</div>;
  if (!spec) return <div>Loading...</div>;

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href={`/services/${spec.serviceId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Service
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              API Spec v{spec.version}
            </h1>
            <p className="text-gray-600">{spec.service.name}</p>
            <p className="text-sm text-gray-500">
              {spec.format} • Uploaded {new Date(spec.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {generating ? 'Generating...' : 'Generate Contract Suite'}
          </button>
        </div>
      </div>

      {parsedSpec && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Parsed Spec Info</h2>
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">{parsedSpec.info.title}</h3>
            <p className="text-sm text-gray-600">Version {parsedSpec.info.version}</p>
            {parsedSpec.info.description && (
              <p className="text-sm text-gray-700 mt-2">{parsedSpec.info.description}</p>
            )}
          </div>

          <h3 className="font-semibold mb-2">Endpoints ({parsedSpec.endpoints.length})</h3>
          <div className="space-y-2">
            {parsedSpec.endpoints.map((endpoint: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded border ${
                  endpoint.method === 'GET' && !endpoint.hasRequiredParams
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-sm">{endpoint.path}</span>
                  {endpoint.method === 'GET' && !endpoint.hasRequiredParams && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      Will be tested
                    </span>
                  )}
                </div>
                {endpoint.summary && (
                  <p className="text-sm text-gray-600 mt-1">{endpoint.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Raw Spec</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">
          {spec.rawText}
        </pre>
      </div>
    </div>
  );
}
