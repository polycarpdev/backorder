"use client";

import { useEffect, useState } from "react";

export default function CommentThread({ backOrderId, currentUser, onApplied }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [isChangeRequest, setIsChangeRequest] = useState(false);
  const [proposedQuantity, setProposedQuantity] = useState("");
  const [proposedDescription, setProposedDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchComments() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/back-orders/${backOrderId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setComments(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchComments();
  }, [backOrderId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError("");

    const proposedChanges = {};
    if (isChangeRequest) {
      if (proposedQuantity.trim()) proposedChanges.quantity = Number(proposedQuantity);
      if (proposedDescription.trim()) proposedChanges.stock_description = proposedDescription.trim();
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/back-orders/${backOrderId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message.trim(),
        is_change_request: isChangeRequest,
        proposed_changes: Object.keys(proposedChanges).length > 0 ? proposedChanges : null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to post comment");
      return;
    }

    setMessage("");
    setIsChangeRequest(false);
    setProposedQuantity("");
    setProposedDescription("");
    fetchComments();
  }

  async function handleApply(commentId) {
    const confirmed = window.confirm("Apply this change request? This will update the back order and cannot be easily undone.\n\nClick OK to confirm.");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}/apply`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      fetchComments();
      onApplied?.();
    }
  }

  async function handleDismiss(commentId) {
    const confirmed = window.confirm("Dismiss this change request? The requester will be notified.\n\nClick OK to confirm.");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}/dismiss`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchComments();
  }

  return (
    <div className="border-t border-[var(--color-steel)]/20 pt-6 mt-6">
      <h2 className="font-medium mb-3">Comments & Change Requests</h2>

      {loading ? (
        <p className="text-sm text-[var(--color-steel)]">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--color-steel)] mb-4">No comments yet.</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`text-sm p-3 rounded border ${
                c.is_change_request
                  ? "border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10"
                  : "border-[var(--color-steel)]/15 bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-medium">
                  {c.author_name}{" "}
                  <span className="text-xs text-[var(--color-steel)] font-normal">({c.author_role})</span>
                </p>
                <p className="text-xs text-[var(--color-steel)]">
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              <p>{c.message}</p>

              {c.is_change_request && (
                <div className="mt-2">
                  {c.proposed_changes && (
                    <p className="text-xs text-[var(--color-steel)] mb-2">
                      Proposed: {Object.entries(c.proposed_changes).map(([k, v]) => `${k} → ${v}`).join(", ")}
                    </p>
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      c.status === "OPEN"
                        ? "bg-[var(--color-amber)]/30 text-[var(--color-ink)]"
                        : c.status === "APPLIED"
                        ? "bg-[var(--color-signal)]/20 text-[var(--color-signal)]"
                        : "bg-[var(--color-steel)]/20 text-[var(--color-steel)]"
                    }`}
                  >
                    {c.status}
                  </span>

                  {c.status === "OPEN" && currentUser.role === "ADMIN" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApply(c.id)}
                        className="text-xs bg-[var(--color-ink)] text-white rounded px-3 py-1 hover:opacity-90"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDismiss(c.id)}
                        className="text-xs border border-[var(--color-steel)]/30 rounded px-3 py-1 hover:bg-[var(--color-steel)]/10"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-rust)] mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
        />

        {currentUser.role === "CRO" && (
          <label className="flex items-center gap-2 text-xs text-[var(--color-steel)]">
            <input
              type="checkbox"
              checked={isChangeRequest}
              onChange={(e) => setIsChangeRequest(e.target.checked)}
            />
            This is a change request
          </label>
        )}

        {isChangeRequest && (
          <div className="grid grid-cols-2 gap-2 pl-6">
            <input
              type="number"
              value={proposedQuantity}
              onChange={(e) => setProposedQuantity(e.target.value)}
              placeholder="New quantity (optional)"
              className="border border-[var(--color-steel)]/30 rounded px-2 py-1.5 bg-[var(--color-surface)] text-sm"
            />
            <input
              type="text"
              value={proposedDescription}
              onChange={(e) => setProposedDescription(e.target.value)}
              placeholder="New description (optional)"
              className="border border-[var(--color-steel)]/30 rounded px-2 py-1.5 bg-[var(--color-surface)] text-sm"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="btn-primary rounded px-4 py-1.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
