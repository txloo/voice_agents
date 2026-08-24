export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="mt-1 text-sm text-gray-600">Usage metrics and insights</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Calls", value: "--", change: "" },
          { label: "Total Minutes", value: "--", change: "" },
          { label: "Active Agents", value: "--", change: "" },
          { label: "Total Cost", value: "$0.00", change: "" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Usage Over Time</h2>
        <p className="mt-4 text-center text-gray-500">
          Charts and detailed analytics coming soon
        </p>
      </div>
    </div>
  );
}
