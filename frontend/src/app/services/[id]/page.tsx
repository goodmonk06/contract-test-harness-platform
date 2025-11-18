'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { servicesApi, apiSpecsApi, contractSuitesApi } from '@/lib/api';

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const { data: service, error } = useSWR(`/services/${params.id}`, () =>
    servicesApi.getOne(params.id).then((res) => res.data)
  );

  const [activeTab, setActiveTab] = useState<'specs' | 'contracts'>('specs');

  if (error) return <div className="text-red-600">Failed to load service</div>;
  if (!service) return <div>Loading...</div>;

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link href="/services" className="text-blue-600 hover:underline">
          ← Back to Services
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
        <p className="text-gray-600 mb-4">{service.baseUrl}</p>
        {service.description && (
          <p className="text-gray-700">{service.description}</p>
        )}
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('specs')}
              className={`${
                activeTab === 'specs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              API Specs ({service.apiSpecs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`${
                activeTab === 'contracts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Contract Suites ({service.contractSuites?.length || 0})
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'specs' && (
        <SpecsTab serviceId={params.id} specs={service.apiSpecs} />
      )}
      {activeTab === 'contracts' && (
        <ContractsTab serviceId={params.id} contracts={service.contractSuites} />
      )}
    </div>
  );
}

function SpecsTab({ serviceId, specs }: { serviceId: string; specs: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    format: 'OPENAPI_JSON',
    rawText: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiSpecsApi.create({
        serviceId,
        ...formData,
      });
      setFormData({ version: '', format: 'OPENAPI_JSON', rawText: '' });
      setShowForm(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to create spec:', error);
      alert(`Failed to create spec: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Upload API Spec'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload OpenAPI Spec</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Version
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) =>
                  setFormData({ ...formData, format: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              >
                <option value="OPENAPI_JSON">OpenAPI JSON</option>
                <option value="OPENAPI_YAML">OpenAPI YAML</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                OpenAPI Spec
              </label>
              <textarea
                required
                value={formData.rawText}
                onChange={(e) =>
                  setFormData({ ...formData, rawText: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border font-mono text-sm"
                rows={12}
                placeholder={formData.format === 'OPENAPI_JSON' ? '{\n  "openapi": "3.0.0",\n  ...\n}' : 'openapi: 3.0.0\n...'}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Spec
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {specs?.map((spec: any) => (
          <div key={spec.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Version {spec.version}</h3>
                <p className="text-sm text-gray-600">
                  {spec.format} • {new Date(spec.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/specs/${spec.id}`}
                className="text-blue-600 hover:underline"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {(!specs || specs.length === 0) && !showForm && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No API specs uploaded yet</p>
        </div>
      )}
    </div>
  );
}

function ContractsTab({ serviceId, contracts }: { serviceId: string; contracts: any[] }) {
  return (
    <div>
      <div className="space-y-4">
        {contracts?.map((contract: any) => (
          <Link
            key={contract.id}
            href={`/contracts/${contract.id}`}
            className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">{contract.name}</h3>
            {contract.description && (
              <p className="text-gray-600 mb-2">{contract.description}</p>
            )}
            <p className="text-sm text-gray-500">
              Created {new Date(contract.createdAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>

      {(!contracts || contracts.length === 0) && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No contract suites yet</p>
          <p className="text-sm text-gray-400">
            Upload an API spec first, then generate a contract suite
          </p>
        </div>
      )}
    </div>
  );
}
