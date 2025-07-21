import React, { useEffect, useState } from "react";
import { MailOpen, Mail, Archive, Trash2, Loader2 } from "lucide-react";

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "archived";
  submittedAt: string;
}

type Filter = "all" | "unread" | "read" | "archived";

const statusLabels = {
  unread: "Unread",
  read: "Read",
  archived: "Archived",
};

export default function InboxContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState<Filter>("unread");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact/admin");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filtered = messages.filter((m) =>
    filter === "all"
      ? m.status !== "archived"
      : filter === "archived"
      ? m.status === "archived"
      : m.status === filter
  );

  const handleAction = async (id: string, action: "read" | "unread" | "archive" | "delete") => {
    setActionLoading(true);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/contact/admin`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          fetchMessages();
          if (selected && selected._id === id) setSelected(null);
        }
      } else {
        const res = await fetch(`/api/contact/admin`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        if (res.ok) {
          fetchMessages();
          if (selected && selected._id === id && action === "archive") setSelected(null);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* List */}
      <div className="w-1/3 border-r bg-white h-full overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-600">Inbox</h2>
          <div className="flex gap-2">
            {(["all", "unread", "read", "archived"] as Filter[]).map((f) => (
              <button
                key={f}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-150 ${filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No messages found.</div>
        ) : (
          <ul>
            {filtered.map((msg) => (
              <li
                key={msg._id}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-blue-50 transition-all ${selected?._id === msg._id ? "bg-blue-100" : ""}`}
                onClick={() => setSelected(msg)}
              >
                <div className="flex items-center gap-2">
                  {msg.status === "unread" ? <Mail className="w-4 h-4 text-blue-500" /> : <MailOpen className="w-4 h-4 text-gray-400" />}
                  <span className="font-semibold text-blue-900">{msg.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{new Date(msg.submittedAt).toLocaleString()}</span>
                </div>
                <div className="text-sm text-blue-700 truncate">{msg.subject}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Detail Panel */}
      <div className="flex-1 h-full bg-gray-50 p-8 relative">
        {selected ? (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-blue-100">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-lg font-bold text-blue-900">{selected.subject}</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${selected.status === "unread" ? "bg-blue-100 text-blue-700" : selected.status === "read" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>{statusLabels[selected.status]}</span>
              <span className="ml-auto text-xs text-gray-400">{new Date(selected.submittedAt).toLocaleString()}</span>
            </div>
            <div className="mb-2 text-blue-800"><span className="font-medium">From:</span> {selected.name} ({selected.email})</div>
            <div className="mb-6 whitespace-pre-line text-gray-800">{selected.message}</div>
            <div className="flex gap-3">
              {selected.status !== "read" && (
                <button onClick={() => handleAction(selected._id, "read")}
                  className="flex items-center gap-1 px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-60" disabled={actionLoading}>
                  <MailOpen className="w-4 h-4" /> Mark as Read
                </button>
              )}
              {selected.status !== "unread" && (
                <button onClick={() => handleAction(selected._id, "unread")}
                  className="flex items-center gap-1 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-60" disabled={actionLoading}>
                  <Mail className="w-4 h-4" /> Mark as Unread
                </button>
              )}
              {selected.status !== "archived" && (
                <button onClick={() => handleAction(selected._id, "archive")}
                  className="flex items-center gap-1 px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition disabled:opacity-60" disabled={actionLoading}>
                  <Archive className="w-4 h-4" /> Archive
                </button>
              )}
              <button onClick={() => handleAction(selected._id, "delete")}
                className="flex items-center gap-1 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-60" disabled={actionLoading}>
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              {/* Reply Button */}
              <a
                href={`mailto:${selected.email}`}
                className="flex items-center gap-1 px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition disabled:opacity-60"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="w-4 h-4" /> Reply
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MailOpen className="w-16 h-16 mb-4" />
            <div className="text-lg">Select a message to view details</div>
          </div>
        )}
      </div>
    </div>
  );
} 