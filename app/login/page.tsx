"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  return (
    <div className="flex flex-col gap-3 p-10 max-w-sm mx-auto">
      <h1 className="text-xl font-bold">Logga in</h1>

      <input
        className="border p-2"
        placeholder="E-post"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2"
        placeholder="Lösenord"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="bg-blue-600 text-white p-2" onClick={login}>
        Logga in
      </button>
    </div>
  );
}
