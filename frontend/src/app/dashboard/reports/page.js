"use client";

import { useEffect, useState, useMemo } from "react";

const columns = [
  { key: "client_name", label: "Client" },
  { key: "stock_code", label: "Stock Code" },
  { key: "stock_description", label: "Description" },
  { key: "quantity", label: "Qty" },
  { key: "supplier_name", label: "Supplier" },
  { key: "assigned_staff_name", label: "Assigned Staff" },
  { key: "eta", label: "ETA" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
];

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  async function fetchReport() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (status !== "ALL") params.append("status", status);

    const res = await fetch(`http://localhost:5000/api/reports?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchReport();
  }, []);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
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
    return copy;
  }, [rows, sortKey, sortDir]);

  function handlePrint() {
    window.print();
  }

  const reportTitle = user?.role === "ADMIN"
    ? "Back Order Report — All Records"
    : user?.role === "CRO"
    ? "Back Order Report — My Created Back Orders"
    : "Back Order Report — My Assigned Back Orders";

  return (
    <div>
      <div id="report-print-area">
        <div className="flex justify-between items-start mb-6 print:mb-4">
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold">
              {reportTitle}
            </h1>
            <p className="text-xs text-[var(--color-steel)] mt-1 print:block hidden">
              Generated {new Date().toLocaleString()}
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="print:hidden btn-primary rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Download as PDF
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4 print:hidden">
          <div>
            <label className="block text-xs text-[var(--color-steel)] mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-[var(--color-steel)]/30 rounded px-2 py-1.5 bg-[var(--color-surface)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-steel)] mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-[var(--color-steel)]/30 rounded px-2 py-1.5 bg-[var(--color-surface)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-steel)] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-[var(--color-steel)]/30 rounded px-2 py-1.5 bg-[var(--color-surface)] text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              className="border border-[var(--color-steel)]/30 rounded px-4 py-1.5 text-sm hover:bg-[var(--color-steel)]/10"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--color-steel)]">Loading...</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-[var(--color-steel)]">No records match these filters.</p>
        ) : (
          <div className="border border-[var(--color-steel)]/20 rounded overflow-hidden print:border-black">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-steel)]/10 text-left print:bg-transparent">
                <tr>
                  <th className="px-3 py-2 font-medium w-10">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-3 py-2 font-medium cursor-pointer select-none hover:bg-[var(--color-steel)]/20 print:cursor-auto"
                    >
                      {col.label}
                      {sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => (
                  <tr key={r.id} className="border-t border-[var(--color-steel)]/10">
                    <td className="px-3 py-2 text-[var(--color-steel)]">{idx + 1}</td>
                    <td className="px-3 py-2">{r.client_name}</td>
                    <td className="px-3 py-2 font-[family-name:var(--font-mono)]">{r.stock_code}</td>
                    <td className="px-3 py-2">{r.stock_description}</td>
                    <td className="px-3 py-2">{r.quantity}</td>
                    <td className="px-3 py-2">{r.supplier_name || "—"}</td>
                    <td className="px-3 py-2">{r.assigned_staff_name || "—"}</td>
                    <td className="px-3 py-2">{r.eta ? new Date(r.eta).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-2">{r.status.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-[var(--color-steel)] mt-4 print:block hidden">
          {sorted.length} record(s) — BackOrder Supply Chain Ops
        </p>
      </div>
    </div>
  );
}
