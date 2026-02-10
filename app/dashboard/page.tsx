import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Hämta användarens roll från users tabellen
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role, email")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-white p-6 rounded shadow">
        <p className="text-lg">Välkommen, <strong>{user.email}</strong>!</p>
        <p className="text-sm text-gray-500 mt-1">User ID: {user.id}</p>
        
        {profileError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            Fel vid hämtning av profil: {profileError.message}
          </div>
        )}
        
        {userProfile && (
          <p className="mt-2 text-sm text-gray-600">
            Roll: <span className="font-semibold uppercase">{userProfile.role}</span>
          </p>
        )}
        
        <div className="mt-6 flex gap-4">
          <a 
            href="/jobs" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Visa Jobb
          </a>
          <a 
            href="/candidates" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Visa Kandidater
          </a>
          {userProfile?.role === 'admin' && (
            <a 
              href="/admin" 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Admin Panel
            </a>
          )}
        </div>

        <div className="mt-6">
          <form action="/api/auth/logout" method="POST">
            <button 
              type="submit"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Logga ut
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}