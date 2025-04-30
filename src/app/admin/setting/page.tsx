// File: app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [message, setMessage] = useState("");
  const [until, setUntil] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch current settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/system/settings");
        const data = await res.json();
        setMaintenanceMode(data.maintenanceMode);
        setMessage(data.message);
        setUntil(data.until ? data.until.substring(0, 16) : ""); // for datetime-local input
      } catch (err) {
        console.error("Failed to load system settings", err);
      }
    };
    fetchSettings();
  }, []);

  // Submit updates
  const updateSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode, message, until }),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      alert("Settings updated successfully");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded space-y-6">
      <h2 className="text-2xl font-bold">System Maintenance Settings</h2>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
          />
          <span className="text-lg font-medium">Enable Maintenance Mode</span>
        </label>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full border p-2 rounded"
          placeholder="Maintenance message shown to users"
        />

        <label className="block">
          Show until:
          <input
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="w-full mt-1 border p-2 rounded"
          />
        </label>

        <button
          onClick={updateSettings}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <Check className="w-4 h-4" /> Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
