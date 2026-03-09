"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { register } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Validation error");
        setLoading(false);
        return;
      }

      // Sign in after successful registration
      const signInResult = await signIn("credentials", {
        email: formData.get("email") as string,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
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
          <p className="text-casino-text-secondary mt-2">Create your account</p>
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
              name="email"
              type="email"
              required
              className="w-full bg-casino-surface-light border border-casino-border rounded-casino px-4 py-3 text-casino-text placeholder-casino-text-muted focus:border-casino-green transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm text-casino-text-secondary mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full bg-casino-surface-light border border-casino-border rounded-casino px-4 py-3 text-casino-text placeholder-casino-text-muted focus:border-casino-green transition-colors"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-casino-text-secondary mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full bg-casino-surface-light border border-casino-border rounded-casino px-4 py-3 text-casino-text placeholder-casino-text-muted focus:border-casino-green transition-colors"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-casino-text-secondary mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="w-full bg-casino-surface-light border border-casino-border rounded-casino px-4 py-3 text-casino-text placeholder-casino-text-muted focus:border-casino-green transition-colors"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-casino-green hover:bg-casino-green-hover text-casino-bg font-semibold py-3 rounded-casino transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-xs text-casino-text-muted text-center">
            You&apos;ll receive 10,000 demo credits to start playing
          </p>
        </form>

        <p className="text-center text-casino-text-secondary mt-6 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-casino-green hover:text-casino-green-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
