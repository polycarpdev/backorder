"use client";

import { useState, useEffect } from "react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchSuppliers() {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/suppliers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSuppliers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/suppliers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim(), contact: contact.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create supplier");
      return;
    }
    setName("");
    setContact("");
    fetchSuppliers();
  }

  return (
    <div>
      <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-6">
        Suppliers
      </h1>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8 max-w-xl">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Supplier name"
          className="flex-1 border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Contact (optional)"
          className="flex-1 border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
        <button
          type="submit"
          className="btn-primary rounded px-4 py-2 font-medium hover:opacity-90 transition"
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm text-[var(--color-rust)] mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-[var(--color-steel)]">Loading...</p>
      ) : (
        <div className="border border-[var(--color-steel)]/20 rounded overflow-hidden max-w-xl">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-steel)]/10 text-left">
              <tr>
                <th className="px-4 py-2 font-medium w-10">#</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, idx) => (
                <tr key={s.id} className="border-t border-[var(--color-steel)]/10">
                  <td className="px-4 py-2 text-[var(--color-steel)]">{idx + 1}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.contact || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
