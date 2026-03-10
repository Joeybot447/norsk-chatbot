/**
 * Dashboard App Component
 * Main application entry point (Sprint 2 - for now just placeholder)
 */

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">NorskBot Dashboard</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-gray-600 mb-4">
            The dashboard is under development. Check back soon for:
          </p>
          <ul className="text-gray-600 space-y-2 inline-block text-left">
            <li>✓ Chat widget configuration</li>
            <li>✓ Document management (upload, crawl)</li>
            <li>✓ Analytics dashboard</li>
            <li>✓ Conversation history</li>
            <li>✓ Team management</li>
            <li>✓ Billing settings</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
