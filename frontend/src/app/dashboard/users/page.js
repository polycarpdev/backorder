"use client";

import { useState, useEffect } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");

  async function fetchUsers() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUserId(JSON.parse(stored).id);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create user");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setRole("STAFF");
    fetchUsers();
  }

  function startEdit(u) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword("");
  }

  async function saveEdit(id) {
    setError("");
    const token = localStorage.getItem("token");
    const body = { name: editName.trim(), email: editEmail.trim(), role: editRole };
    if (editPassword.trim()) body.password = editPassword;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update user");
      return;
    }
    setEditingId(null);
    fetchUsers();
  }

  async function toggleActive(u) {
    const action = u.is_active ? "suspend" : "reactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${u.name}'s account?\n\nClick OK to confirm.`
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${u.id}/active`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update account status");
      return;
    }
    fetchUsers();
  }

  return (
    <div>
      <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-6">
        Manage Users
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 mb-8 max-w-xl">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Full name"
          className="border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
          className="border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Initial password"
          className="border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        >
          <option value="STAFF">Staff</option>
          <option value="CRO">Client Relations Officer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          className="col-span-2 btn-primary rounded px-4 py-2 font-medium hover:opacity-90 transition"
        >
          Create User
        </button>
      </form>

      {error && <p className="text-sm text-[var(--color-rust)] mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-[var(--color-steel)]">Loading...</p>
      ) : (
        <div className="border border-[var(--color-steel)]/20 rounded overflow-hidden max-w-4xl">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-steel)]/10 text-left">
              <tr>
                <th className="px-4 py-2 font-medium w-10">#</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) =>
                editingId === u.id ? (
                  <tr key={u.id} className="border-t border-[var(--color-steel)]/10 bg-[var(--color-steel)]/5">
                    <td className="px-4 py-2 text-[var(--color-steel)]">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-[var(--color-steel)]/30 rounded px-2 py-1 w-full text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="border border-[var(--color-steel)]/30 rounded px-2 py-1 w-full text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="border border-[var(--color-steel)]/30 rounded px-2 py-1 text-sm"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="CRO">CRO</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="New password (optional)"
                        className="border border-[var(--color-steel)]/30 rounded px-2 py-1 w-full text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => saveEdit(u.id)}
                        className="text-xs bg-[var(--color-ink)] text-white rounded px-3 py-1 hover:opacity-90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs border border-[var(--color-steel)]/30 rounded px-3 py-1 hover:bg-[var(--color-steel)]/10"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} className="border-t border-[var(--color-steel)]/10">
                    <td className="px-4 py-2 text-[var(--color-steel)]">{idx + 1}</td>
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.role}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          u.is_active
                            ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
                            : "bg-[var(--color-rust)]/15 text-[var(--color-rust)]"
                        }`}
                      >
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        className="text-xs border border-[var(--color-steel)]/30 rounded px-3 py-1 hover:bg-[var(--color-steel)]/10"
                      >
                        Edit
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => toggleActive(u)}
                          className={`text-xs rounded px-3 py-1 ${
                            u.is_active
                              ? "border border-[var(--color-rust)]/40 text-[var(--color-rust)] hover:bg-[var(--color-rust)]/10"
                              : "border border-[var(--color-signal)]/40 text-[var(--color-signal)] hover:bg-[var(--color-signal)]/10"
                          }`}
                        >
                          {u.is_active ? "Suspend" : "Reactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
