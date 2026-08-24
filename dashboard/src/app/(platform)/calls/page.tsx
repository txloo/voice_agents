"use client";

import { useEffect, useState } from "react";

interface Call {
  id: string;
  direction: string;
  from_number: string | null;
  to_number: string | null;
  status: string;
  duration_seconds: number | null;
  cost_cents: number;
  created_at: string;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("/v1/calls", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCalls(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
      <p className="mt-1 text-sm text-gray-600">View all call history</p>

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Loading...</p>
      ) : calls.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-gray-500">No calls yet</p>
        </div>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {call.direction === "inbound" ? "📥 Inbound" : "📤 Outbound"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{call.from_number || "--"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{call.to_number || "--"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    ${(call.cost_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        call.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : call.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(call.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
