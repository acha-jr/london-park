"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogin = async () => {
    if (!form.email || !form.password) return alert("Please fill all fields");
    setLoading(true);

    try {
      const res = await fetch("http://localhost/london-park/user_login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);

      if (data.status === "success") {
        localStorage.setItem("user_token", data.token);
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user_name", data.user.name);
        router.push("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-700 mb-6 text-center">Login</h1>

        <div className="mb-4">
          <label className="block text-gray-600 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-600 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
          />
        </div>

        <button
          disabled={loading}
          onClick={handleLogin}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-all cursor-pointer"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-4 text-center text-gray-500">
          Don’t have an account?{" "}
          <span
            className="text-green-500 cursor-pointer hover:underline"
            onClick={() => router.push("/register")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}