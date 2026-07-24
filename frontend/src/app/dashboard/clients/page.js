"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      });
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-6">
        Clients
      </h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clients..."
        className="border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] text-sm w-72 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
      />

      {loading ? (
        <p className="text-sm text-[var(--color-steel)]">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-steel)]">No clients found.</p>
      ) : (
        <div className="border border-[var(--color-steel)]/20 rounded overflow-hidden max-w-lg">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-steel)]/10 text-left">
              <tr>
                <th className="px-4 py-2 font-medium w-10">#</th>
                <th className="px-4 py-2 font-medium">Name</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id} className="border-t border-[var(--color-steel)]/10 hover:bg-[var(--color-steel)]/5">
                  <td className="px-4 py-2 text-[var(--color-steel)]">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <Link href={`/dashboard/clients/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
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
