"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/v1/agents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAgents(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    const res = await fetch("/v1/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      fetchAgents();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your voice AI agents
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + New Agent
        </button>
      </div>

      {showCreate && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold">Create Agent</h2>
          <form onSubmit={createAgent} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="input mt-1"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Loading...</p>
      ) : agents.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-gray-500">No agents yet. Create your first one!</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <div className="card cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      agent.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                {agent.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {agent.description}
                  </p>
                )}
                <p className="mt-4 text-xs text-gray-400">
                  Created {new Date(agent.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
