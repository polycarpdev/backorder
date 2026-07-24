"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import CommentThread from "./CommentThread";

export default function BackOrderModal({ backOrderId, onClose, onUpdated }) {
  const [backOrder, setBackOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [eta, setEta] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchBackOrder() {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/back-orders/${backOrderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load back order");
      setLoading(false);
      return;
    }
    setBackOrder(data);
    setSupplierId(data.supplier_id || "");
    setStaffId(data.assigned_staff_id || "");
    setEta(data.eta ? data.eta.split("T")[0] : "");
    setLoading(false);
  }

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    fetchBackOrder();

    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/suppliers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSuppliers);

    fetch("http://localhost:5000/api/users?role=STAFF", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setStaffList);
  }, [backOrderId]);

  async function handleAssign(e) {
    e.preventDefault();
    setError("");

    const supplierName = suppliers.find((s) => s.id === Number(supplierId))?.name || "selected supplier";
    const staffName = staffList.find((s) => s.id === Number(staffId))?.name || "selected staff";
    const confirmed = window.confirm(
      `Assign this back order to ${staffName}, sourced from ${supplierName}, with ETA ${new Date(eta).toLocaleDateString()}?\n\nThis cannot be undone easily — please confirm.`
    );
    if (!confirmed) return;

    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/back-orders/${backOrderId}/assign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        supplier_id: Number(supplierId),
        assigned_staff_id: Number(staffId),
        eta,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to assign");
      return;
    }
    setBackOrder(data);
    onUpdated();
  }

  async function handleStatusChange(newStatus) {
    const confirmed = window.confirm(
      `Change status to "${newStatus.replace(/_/g, " ")}"? This will be recorded in the audit log.\n\nClick OK to confirm.`
    );
    if (!confirmed) return;

    setError("");
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/back-orders/${backOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to update status");
      return;
    }
    setBackOrder(data);
    onUpdated();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-overlay"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-paper)] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-steel)] hover:text-[var(--color-ink)]"
        >
          <X size={20} />
        </button>

        {loading && <p className="text-sm text-[var(--color-steel)]">Loading...</p>}
        {error && !backOrder && <p className="text-sm text-[var(--color-rust)]">{error}</p>}

        {backOrder && user && (
          <>
            <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-1 pr-8">
              {backOrder.client_name}
            </h1>
            <p className="text-sm text-[var(--color-steel)] font-[family-name:var(--font-mono)] mb-6">
              {backOrder.stock_code}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div>
                <p className="text-[var(--color-steel)]">Description</p>
                <p>{backOrder.stock_description}</p>
              </div>
              <div>
                <p className="text-[var(--color-steel)]">Quantity</p>
                <p>{backOrder.quantity}</p>
              </div>
              <div>
                <p className="text-[var(--color-steel)]">Status</p>
                <p>{backOrder.status.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-[var(--color-steel)]">Created</p>
                <p>{new Date(backOrder.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[var(--color-steel)]">Supplier</p>
                <p>{backOrder.supplier_name || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--color-steel)]">Assigned Staff</p>
                <p>{backOrder.assigned_staff_name || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--color-steel)]">ETA</p>
                <p>{backOrder.eta ? new Date(backOrder.eta).toLocaleDateString() : "—"}</p>
              </div>
            </div>

            {error && <p className="text-sm text-[var(--color-rust)] mb-4">{error}</p>}

            {user.role === "ADMIN" && (
              <div className="border-t border-[var(--color-steel)]/20 pt-6 mb-6">
                <h2 className="font-medium mb-3">Assign Supplier & Staff</h2>
                <form onSubmit={handleAssign} className="space-y-3">
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] text-sm"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <select
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                    className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] text-sm"
                  >
                    <option value="">Select staff</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    required
                    className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] text-sm"
                  />

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Assign"}
                  </button>
                </form>
              </div>
            )}

            {user.role === "ADMIN" && backOrder.status !== "PENDING_ASSIGNMENT" && (
              <div className="border-t border-[var(--color-steel)]/20 pt-6 mb-6">
                <h2 className="font-medium mb-3">Override Status</h2>
                <div className="flex gap-2">
                  {["ACTIVE", "COMPLETED", "CLOSED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={saving || backOrder.status === s}
                      className="border border-[var(--color-steel)]/30 rounded px-3 py-1.5 text-sm hover:bg-[var(--color-steel)]/10 disabled:opacity-40"
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {user.role === "STAFF" && backOrder.assigned_staff_id === user.id && backOrder.status === "ACTIVE" && (
              <div className="border-t border-[var(--color-steel)]/20 pt-6">
                <h2 className="font-medium mb-3">Mark Delivery</h2>
                <button
                  onClick={() => handleStatusChange("COMPLETED")}
                  disabled={saving}
                  className="bg-[var(--color-signal)] text-white rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Mark as Restocked / Completed"}
                </button>
              </div>
            )}

            <CommentThread backOrderId={backOrderId} currentUser={user} onApplied={fetchBackOrder} />
          </>
        )}
      </div>
    </div>
  );
}
