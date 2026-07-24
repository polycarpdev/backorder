"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NewBackOrderPage() {
  const [clientName, setClientName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stockCode, setStockCode] = useState("");
  const [stockDescription, setStockDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const debounceRef = useRef(null);

  useEffect(() => {
    async function fetchNextCode() {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/stock-codes/next", {
        headers: { Authorization: `Bearer ${token}` },
      });

      
      const data = await res.json();
      setStockCode(data.stock_code);
    }
    fetchNextCode();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!clientName.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/clients?search=${encodeURIComponent(clientName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSuggestions(data);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [clientName]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/back-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_name: clientName.trim(),
          stock_code: stockCode.trim(),
          stock_description: stockDescription.trim(),
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create back order");
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Could not reach the server");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold mb-6">
        New Back Order
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm text-[var(--color-steel)] mb-1">Client Name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            required
            autoComplete="off"
            className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] focus:border-transparent"
            placeholder="Start typing a client name..."
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-[var(--color-surface)] border border-[var(--color-steel)]/30 rounded mt-1 max-h-48 overflow-y-auto shadow-sm">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  onMouseDown={() => {
                    setClientName(s.name);
                    setShowSuggestions(false);
                  }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-steel)]/10"
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm text-[var(--color-steel)] mb-1">
            Stock Code <span className="text-[var(--color-steel)]/60">(auto-generated, editable)</span>
          </label>
          <input
            type="text"
            value={stockCode}
            onChange={(e) => setStockCode(e.target.value)}
            required
            className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] font-[family-name:var(--font-mono)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--color-steel)] mb-1">Stock Description</label>
          <input
            type="text"
            value={stockDescription}
            onChange={(e) => setStockDescription(e.target.value)}
            required
            className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] focus:border-transparent"
            placeholder="Name of the missing product"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--color-steel)] mb-1">Back Order Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full border border-[var(--color-steel)]/30 rounded px-3 py-2 bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] focus:border-transparent"
            placeholder="0"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--color-rust)] border-l-2 border-[var(--color-rust)] pl-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary rounded px-4 py-2 font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Back Order"}
        </button>
      </form>
    </div>
  );
}
