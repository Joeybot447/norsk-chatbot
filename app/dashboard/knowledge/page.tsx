'use client';

import { useState } from 'react';

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState('sources');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-100 h-14 flex items-center px-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-white"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="font-bold text-blue-600">NorskBot</span>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200 pt-3 overflow-y-auto">
        <div className="px-4 space-y-2">
          <div
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer text-sm transition ${
              activeTab === 'sources'
                ? 'bg-blue-100 text-blue-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>📚</span>
            <span>Kilder</span>
          </div>
          <div
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer text-sm transition ${
              activeTab === 'settings'
                ? 'bg-blue-100 text-blue-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>⚙️</span>
            <span>Innstillinger</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-56 mt-14 p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kunnskapsbase</h1>
        <p className="text-gray-600 mb-8">
          Administrer kilder og dokumenter som bot skal lære fra
        </p>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('sources')}
              className={`pb-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'sources'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Kilder
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Innstillinger
            </button>
          </div>
        </div>

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Legg til kilder</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    URL eller filbane
                  </label>
                  <input
                    type="text"
                    placeholder="https://eksempel.no eller /sti/til/fil.pdf"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:border-blue-600 outline-none"
                  />
                </div>
                <button className="w-full py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition">
                  Legg til kilde
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-semibold">Aktiverte kilder:</p>
              <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500 text-sm">
                Ingen kilder lagt til ennå
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Innstillinger</h3>
            <p className="text-gray-600 text-sm">Mer kommer snart...</p>
          </div>
        )}
      </main>
    </div>
  );
}
