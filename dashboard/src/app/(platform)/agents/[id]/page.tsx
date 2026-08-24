"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface AgentVersion {
  id: string;
  version_number: number;
  system_prompt: string;
  pipeline_config: Record<string, unknown>;
  voice_config: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [agentId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [agentRes, versionsRes] = await Promise.all([
        fetch(`/v1/agents/${agentId}`, { headers }),
        fetch(`/v1/agents/${agentId}/versions`, { headers }),
      ]);

      if (agentRes.ok) setAgent(await agentRes.json());
      if (versionsRes.ok) setVersions(await versionsRes.json());
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!agent) return <p className="text-gray-500">Agent not found</p>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/agents" className="text-sm text-brand-600 hover:text-brand-500">
          &larr; Back to agents
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
          {agent.description && (
            <p className="mt-1 text-sm text-gray-600">{agent.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              agent.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {agent.status}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Versions</h2>
        {versions.length === 0 ? (
          <div className="card mt-4">
            <p className="text-gray-500">No versions yet. Configure your agent to create one.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {versions.map((v) => (
              <div key={v.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Version {v.version_number}</p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(v.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {v.is_published && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Published
                    </span>
                  )}
                  <button className="btn-secondary text-xs">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
