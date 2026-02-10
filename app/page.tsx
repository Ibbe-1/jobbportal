// src/app/page.tsx
export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-10 font-sans gap-6">
      <h1 className="text-3xl font-bold text-black dark:text-white">Välkommen till mini-ATS</h1>
      <p className="text-lg text-zinc-700 dark:text-zinc-300">Navigera till dina sidor nedan:</p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Logga in
        </a>
        <a
          href="/dashboard"
          className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Dashboard
        </a>
        <a
          href="/jobs"
          className="px-5 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
        >
          Mina Jobb
        </a>
      </div>
    </div>
  );
}
