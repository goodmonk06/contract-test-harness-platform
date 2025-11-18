'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { servicesApi } from '@/lib/api';

export default function ServicesPage() {
  const { data, error, mutate } = useSWR('/services', () =>
    servicesApi.getAll().then((res) => res.data)
  );

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await servicesApi.create(formData);
      setFormData({ name: '', baseUrl: '', description: '' });
      setShowForm(false);
      mutate();
    } catch (error) {
      console.error('Failed to create service:', error);
      alert('Failed to create service');
    }
  };

  if (error) return <div className="text-red-600">Failed to load services</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Service</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base URL
              </label>
              <input
                type="url"
                required
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Service
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((service: any) => (
          <Link
            key={service.id}
            href={`/services/${service.id}`}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {service.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{service.baseUrl}</p>
            {service.description && (
              <p className="text-sm text-gray-500 mb-4">{service.description}</p>
            )}
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{service._count.apiSpecs} specs</span>
              <span>{service._count.contractSuites} suites</span>
            </div>
          </Link>
        ))}
      </div>

      {data.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No services yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Your First Service
          </button>
        </div>
      )}
    </div>
  );
}
