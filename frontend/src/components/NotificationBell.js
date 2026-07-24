"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const prevUnreadCount = useRef(0);

  async function fetchNotifications() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const newUnread = data.filter((n) => !n.read_at).length;
      if (newUnread > prevUnreadCount.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 400);
      }
      prevUnreadCount.current = newUnread;
      setNotifications(data);
    } catch (err) {
      // silent fail, next poll will retry
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:5000/api/notifications/read-all", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotifications();
  }

  async function handleClickNotification(n) {
    const token = localStorage.getItem("token");
    if (!n.read_at) {
      await fetch(`http://localhost:5000/api/notifications/${n.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    }
    setOpen(false);
    if (n.back_order_id) {
      router.push(`/dashboard?open=${n.back_order_id}`);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative w-9 h-9 flex items-center justify-center rounded hover:bg-[var(--color-steel)]/10 ${
          pulse ? "animate-bell" : ""
        }`}
      >
        <Bell size={18} color="var(--color-ink)" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--color-rust)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] border border-[var(--color-steel)]/20 rounded shadow-lg z-50 max-h-96 overflow-y-auto animate-dropdown">
          <div className="flex justify-between items-center px-4 py-2 border-b border-[var(--color-steel)]/10">
            <p className="text-sm font-medium">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-[var(--color-steel)] hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-[var(--color-steel)] px-4 py-6 text-center">No notifications yet.</p>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                style={{ animationDelay: `${i * 25}ms` }}
                className={`px-4 py-3 text-sm border-b border-[var(--color-steel)]/10 cursor-pointer hover:bg-[var(--color-steel)]/5 animate-row ${
                  !n.read_at ? "bg-[var(--color-amber)]/10" : ""
                }`}
              >
                <p>{n.message}</p>
                <p className="text-xs text-[var(--color-steel)] mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
