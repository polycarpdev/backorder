"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackOrderModal from "@/components/BackOrderModal";

const statusColors = {
  PENDING_ASSIGNMENT: "var(--color-steel)",
  ACTIVE: "var(--color-amber)",
  COMPLETED: "var(--color-signal)",
  CLOSED: "var(--color-steel)",
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [backOrders, setBackOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  async function fetchData() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setClient(data.client);
    setBackOrders(data.backOrders);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <p className="text-sm text-[var(--color-steel)]">Loading...</p>;
  if (!client) return <p className="text-sm text-[var(--color-rust)]">Client not found.</p>;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-sm text-[var(--color-steel)] hover:underline mb-4"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-6">
        {client.name}
      </h1>

      {backOrders.length === 0 ? (
        <p className="text-sm text-[var(--color-steel)]">No back orders for this client yet.</p>
      ) : (
        <div className="border border-[var(--color-steel)]/20 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-steel)]/10 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Stock Code</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Qty</th>
                <th className="px-4 py-2 font-medium">Supplier</th>
                <th className="px-4 py-2 font-medium">Assigned</th>
                <th className="px-4 py-2 font-medium">ETA</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {backOrders.map((bo) => (
                <tr
                  key={bo.id}
                  onClick={() => setOpenId(bo.id)}
                  className="border-t border-[var(--color-steel)]/10 hover:bg-[var(--color-steel)]/10 cursor-pointer"
                >
                  <td className="px-4 py-2 font-[family-name:var(--font-mono)]" style={{ borderLeft: `3px solid ${statusColors[bo.status]}` }}>
                    {bo.stock_code}
                  </td>
                  <td className="px-4 py-2">{bo.stock_description}</td>
                  <td className="px-4 py-2">{bo.quantity}</td>
                  <td className="px-4 py-2">{bo.supplier_name || "—"}</td>
                  <td className="px-4 py-2">{bo.assigned_staff_name || "—"}</td>
                  <td className="px-4 py-2">{bo.eta ? new Date(bo.eta).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-2">{bo.status.replace(/_/g, " ")}</td>
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
          onUpdated={fetchData}
        />
      )}
    </div>
  );
}
