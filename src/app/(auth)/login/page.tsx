"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/casino");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-casino-surface rounded-casino-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-casino-green">CasinoR</h1>
          <p className="text-casino-text-secondary mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-casino-red/10 border border-casino-red/30 text-casino-red text-sm rounded-casino p-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-casino-text-secondary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-casino-surface-light border border-casino-border rounded-casino px-4 py-3 text-casino-text placeholder-casino-text-muted focus:border-casino-green transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-casino-text-secondary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-casino-surface-light border border-casino-border rounded-casino px-4 py-3 text-casino-text placeholder-casino-text-muted focus:border-casino-green transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-casino-green hover:bg-casino-green-hover text-casino-bg font-semibold py-3 rounded-casino transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-casino-text-secondary mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-casino-green hover:text-casino-green-hover transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
