export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            NorskBot
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Chatbot for Norwegian Businesses
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/dashboard"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Dashboard
            </a>
            <a
              href="/docs"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              Documentation
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">🤖 AI-Powered</h3>
            <p className="text-gray-600">
              Built with Claude 3.5 Sonnet for intelligent, context-aware responses.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">📚 RAG Knowledge Base</h3>
            <p className="text-gray-600">
              Retrieval-Augmented Generation for accurate answers from your documents.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">🌐 Multi-Tenant</h3>
            <p className="text-gray-600">
              Manage multiple customer sites from one powerful dashboard.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-6">API Endpoints</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="font-mono text-sm text-gray-600">GET /health</p>
              <p className="text-gray-700">Basic health check</p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="font-mono text-sm text-gray-600">POST /api/auth/login</p>
              <p className="text-gray-700">User authentication</p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="font-mono text-sm text-gray-600">POST /api/chat</p>
              <p className="text-gray-700">Send message and get AI response</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
