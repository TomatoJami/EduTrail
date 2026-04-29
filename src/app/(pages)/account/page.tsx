"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ProtectedPage } from "@/components/common/ProtectedPage";
import { AccountSidebar } from "@/components/common/AccountSidebar";
import { useAuth } from "@/hooks/useAuth";

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, error, updateProfile, loadUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    newPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        newPassword: "",
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const hasChanges = formData.name !== user?.name || formData.email !== user?.email || formData.newPassword;
      
      if (!hasChanges) {
        setSaveMessage({ type: 'error', text: 'No changes to save' });
        setIsSaving(false);
        return;
      }

      await updateProfile(
        formData.name !== user?.name ? formData.name : undefined,
        formData.email !== user?.email ? formData.email : undefined,
        formData.newPassword || undefined
      );

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setFormData((prev) => ({ ...prev, newPassword: "" }));
      setShowPasswordInput(false);
    } catch (err) {
      setSaveMessage({ type: 'error', text: error || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedPage>
      <Header />
      <main className="flex flex-1">
        <AccountSidebar />
        

        <div className="flex-1 bg-white">
          <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-12 px-4">
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800">{user?.name}</h1>
              </div>

              <form onSubmit={handleSave}>
                {/* Full Name Field */}
                <div className="mb-8">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email Field */}
                <div className="mb-8">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@gmail.com"
                  />
                </div>

                {/* Password Field */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordInput(!showPasswordInput)}
                      className="text-xs text-gray-600 hover:text-gray-900 font-semibold bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition"
                    >
                      {showPasswordInput ? "Cancel" : "Change password"}
                    </button>
                  </div>
                  {!showPasswordInput && (
                    <p className="text-sm text-gray-600">
                      Set a permanent password for your account
                    </p>
                  )}
                  {showPasswordInput && (
                    <input
                      type="password"
                      id="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="New password (min 8 characters)"
                    />
                  )}
                </div>

                {/* Messages */}
                {saveMessage && (
                  <div
                    className={`p-3 rounded-md text-sm mb-6 ${
                      saveMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}

                {error && !saveMessage && (
                  <div className="p-3 rounded-md text-sm mb-6 bg-red-50 text-red-700 border border-red-200">
                    {error}
                  </div>
                )}

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-50 disabled:bg-gray-100 transition"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedPage>
  );
}