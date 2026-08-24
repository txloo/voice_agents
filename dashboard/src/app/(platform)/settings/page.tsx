"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [tab, setTab] = useState<"providers" | "api-keys" | "phone">("providers");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">Manage your platform configuration</p>

      <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["providers", "api-keys", "phone"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t === "providers" ? "AI Providers" : t === "api-keys" ? "API Keys" : "Phone Numbers"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "providers" && <ProvidersTab />}
        {tab === "api-keys" && <ApiKeysTab />}
        {tab === "phone" && <PhoneTab />}
      </div>
    </div>
  );
}

function ProvidersTab() {
  const providers = [
    { name: "OpenAI", key: "OPENAI_API_KEY", category: "LLM" },
    { name: "Deepgram", key: "DEEPGRAM_API_KEY", category: "STT" },
    { name: "ElevenLabs", key: "ELEVENLABS_API_KEY", category: "TTS" },
    { name: "Telnyx", key: "TELNYX_API_KEY", category: "Telephony" },
  ];

  return (
    <div className="space-y-4">
      {providers.map((p) => (
        <div key={p.key} className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">{p.category}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Not configured
            </span>
            <button className="btn-secondary text-xs">Configure</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<{ id: string; name: string; key_prefix: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/v1/auth/api-keys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end">
        <button className="btn-primary text-xs">+ Create API Key</button>
      </div>

      {loading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="card mt-4 text-center">
          <p className="text-gray-500">No API keys yet</p>
        </div>
      ) : (
        <div className="card mt-4 space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-gray-900">{k.name}</p>
                <p className="text-xs text-gray-500 font-mono">{k.key_prefix}...</p>
              </div>
              <button className="btn-secondary text-xs">Revoke</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhoneTab() {
  return (
    <div className="card">
      <p className="text-gray-500">
        Phone number management coming soon. Configure Telnyx in the Providers tab to get started.
      </p>
    </div>
  );
}
