"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    console.log("=== LOGIN START ===");
    console.log("Email:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login response:", { data, error });

      if (error) {
        console.error("Login error:", error);
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        console.log("Session created:", data.session);
        console.log("Access token:", data.session.access_token.substring(0, 20) + "...");
        
        // Vänta en sekund för att säkerställa cookies är satta
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verifiera att sessionen finns
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session verification:", !!session);
        
        if (session) {
          console.log("Redirecting to dashboard...");
          // Tvinga full page reload
          window.location.href = "/dashboard";
        } else {
          console.error("Session not found after login!");
          setErrorMsg("Session kunde inte skapas. Försök igen.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMsg("Ett oväntat fel inträffade");
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    console.log("=== SIGNUP START ===");
    console.log("Email:", email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Signup response:", { data, error });

      if (error) {
        console.error("Signup error:", error);
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("User created:", data.user.id);
        
        // Kolla om email confirmation krävs
        if (data.session) {
          console.log("Session created, redirecting...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          window.location.href = "/dashboard";
        } else {
          setErrorMsg("Konto skapat! Kolla din email för att verifiera.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMsg("Ett oväntat fel inträffade");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4 text-center">Logga in</h1>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMsg}
          </div>
        )}

        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          <input
            className="border px-3 py-2 rounded"
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <input
            className="border px-3 py-2 rounded"
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Loggar in..." : "Logga in"}
          </button>

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? "Skapar konto..." : "Skapa konto"}
          </button>
        </form>

        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p className="font-bold mb-1">Debug Info:</p>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...</p>
          <p className="mt-2 text-gray-600">Öppna Console (F12) för mer info</p>
        </div>
      </div>
    </div>
  );
}