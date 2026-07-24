"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BackOrderModal from "@/components/BackOrderModal";

const statusColors = {
  PENDING_ASSIGNMENT: "var(--color-steel)",
  ACTIVE: "var(--color-amber)",
  COMPLETED: "var(--color-signal)",
  CLOSED: "var(--color-steel)",
};

const columns = [
  { key: "client_name", label: "Client" },
  { key: "stock_code", label: "Stock Code" },
  { key: "stock_description", label: "Description" },
  { key: "quantity", label: "Qty" },
  { key: "supplier_name", label: "Supplier" },
  { key: "assigned_staff_name", label: "Assigned" },
  { key: "eta", label: "ETA" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
];

export default function DashboardPage() {
  const [backOrders, setBackOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  async function fetchBackOrders() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/back-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load back orders");
      } else {
        setBackOrders(data);
      }
    } catch (err) {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBackOrders();
  }, []);

  useEffect(() => {
    const openParam = searchParams.get("open");
    if (openParam) {
      setOpenId(Number(openParam));
    }
  }, [searchParams]);

  function closeModal() {
    setOpenId(null);
    router.replace("/dashboard");
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let rows = [...backOrders];

    if (statusFilter !== "ALL") {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.client_name?.toLowerCase().includes(q) ||
          r.stock_code?.toLowerCase().includes(q) ||
          r.stock_description?.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [backOrders, sortKey, sortDir, statusFilter, search]);

  return (
    <div>
      <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-6">
        Back Orders
      </h1>

      <div className="flex gap-3 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client, stock code, description..."
          className="border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading && <p className="text-sm text-[var(--color-steel)]">Loading...</p>}
      {error && <p className="text-sm text-[var(--color-rust)]">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-[var(--color-steel)]">No back orders found.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="border border-[var(--color-steel)]/20 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-steel)]/10 text-left">
              <tr>
                <th className="px-4 py-2 font-medium w-10">#</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-2 font-medium cursor-pointer select-none hover:bg-[var(--color-steel)]/20"
                  >
                    {col.label}
                    {sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((bo, idx) => (
                <tr
                  key={bo.id}
                  onClick={() => setOpenId(bo.id)}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className="border-t border-[var(--color-steel)]/10 hover:bg-[var(--color-steel)]/10 cursor-pointer animate-row"
                >
                  <td className="px-4 py-2 text-[var(--color-steel)]">{idx + 1}</td>
                  <td className="px-4 py-2" style={{ borderLeft: `3px solid ${statusColors[bo.status]}` }}>
                    {bo.client_name}
                  </td>
                  <td className="px-4 py-2 font-[family-name:var(--font-mono)]">{bo.stock_code}</td>
                  <td className="px-4 py-2">{bo.stock_description}</td>
                  <td className="px-4 py-2">{bo.quantity}</td>
                  <td className="px-4 py-2">{bo.supplier_name || "—"}</td>
                  <td className="px-4 py-2">{bo.assigned_staff_name || "—"}</td>
                  <td className="px-4 py-2">{bo.eta ? new Date(bo.eta).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-2">{bo.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-[var(--color-steel)]">
                    {new Date(bo.created_at).toLocaleDateString()}
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
          onClose={closeModal}
          onUpdated={fetchBackOrders}
        />
      )}
    </div>
  );
}
