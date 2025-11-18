"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleLogin = () => {
    if (!form.email || !form.password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);

    fetch("http://localhost/london-park/admin_login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (data.status === "success") {
          localStorage.setItem("admin_token", data.token);
          localStorage.setItem("admin_name", data.admin.name);
          router.push("/admin");
        } else {
          alert(data.message);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
        alert("Something went wrong. Try again.");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
      <div className="w-[350px] bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-3 rounded text-white font-semibold transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}