"use client";

import { useEffect, useState } from "react";

type UserItem = {
  _id: string;
  email: string;
  name: string;
  role: string;
};

type StoredUser = {
  id?: string;
  _id?: string;
};

const getUserId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as StoredUser;
    return user._id || user.id || null;
  } catch {
    return null;
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = getUserId();
      if (!userId) {
        setError("Unauthorized: user id not found");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/users", {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users (${response.status})`);
      }

      const data = await response.json();

      if (!Array.isArray(data.data)) {
        throw new Error("Invalid data format");
      }

      setUsers(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setError(message);
      console.error("Load users error:", message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    setSaving(true);
    setError("");

    try {
      const userId = getUserId();
      if (!userId) {
        setError("Unauthorized: user id not found");
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to update user");
      }

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === editingUser._id
            ? {
                ...u,
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
              }
            : u
        )
      );

      setEditingUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user";
      setError(message);
      console.error("Update user error:", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const currentUserId = getUserId();
      if (!currentUserId) {
        setError("Unauthorized: user id not found");
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
        },
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to delete user");
      }

      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      setError(message);
      console.error("Delete user error:", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-slate-900">Users Management</h2>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-600">No users found.</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) =>
            editingUser?._id === user._id ? (
              <div
                key={user._id}
                className="rounded-lg border border-slate-300 bg-slate-50 p-4 space-y-3"
              >
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-slate-700">
                    Role
                  </label>
                  <select
                    id="edit-role"
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, role: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleUpdate()}
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={user._id}
                className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Role:{" "}
                    <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                      {user.role}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(user)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                  >
                    Edit
                  </button>
                  {user.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(user._id)}
                      disabled={saving}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
