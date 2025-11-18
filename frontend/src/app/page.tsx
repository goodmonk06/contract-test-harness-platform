import Link from 'next/link';

export default function Home() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Contract Testing Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage HTTP contract tests across multiple services using OpenAPI specs
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/services"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            View Services
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">1. Define Services</h3>
          <p className="text-gray-600">
            Register your services with their base URLs and descriptions
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">2. Upload OpenAPI Specs</h3>
          <p className="text-gray-600">
            Upload OpenAPI specifications to define your API contracts
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">3. Run Contract Tests</h3>
          <p className="text-gray-600">
            Auto-generate and execute tests to validate your APIs
          </p>
        </div>
      </div>
    </div>
  );
}
