"use client";

import { useEffect, useState } from "react";
import BackOrderModal from "@/components/BackOrderModal";

const actionLabels = {
  CREATED: "Created back order",
  ASSIGNED: "Assigned supplier & staff",
  STATUS_UPDATED: "Updated status",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  async function fetchLogs() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/audit-logs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-6">
        Audit Log
      </h1>

      {loading ? (
        <p className="text-sm text-[var(--color-steel)]">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-[var(--color-steel)]">No activity recorded yet.</p>
      ) : (
        <div className="border border-[var(--color-steel)]/20 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-steel)]/10 text-left">
              <tr>
                <th className="px-4 py-2 font-medium w-10">#</th>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Who</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Back Order</th>
                <th className="px-4 py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={log.id}
                  onClick={() => log.back_order_id && setOpenId(log.back_order_id)}
                  className={`border-t border-[var(--color-steel)]/10 ${
                    log.back_order_id ? "cursor-pointer hover:bg-[var(--color-steel)]/5" : ""
                  }`}
                >
                  <td className="px-4 py-2 text-[var(--color-steel)]">{idx + 1}</td>
                  <td className="px-4 py-2 text-[var(--color-steel)]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{log.user_name || "—"}</td>
                  <td className="px-4 py-2">{actionLabels[log.action] || log.action}</td>
                  <td className="px-4 py-2">
                    {log.back_order_id ? (
                      <span className="hover:underline">
                        <span className="font-[family-name:var(--font-mono)]">{log.stock_code}</span>
                        {" — "}
                        {log.client_name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-steel)]">
                    {log.field_changed
                      ? `${log.field_changed}: ${log.old_value || "—"} → ${log.new_value || "—"}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <BackOrderModal
          backOrderId={openId}
          onClose={() => setOpenId(null)}
          onUpdated={fetchLogs}
        />
      )}
    </div>
  );
}
