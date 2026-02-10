import { createServerClient } from "@/lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = await createServerClient(); 
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Inte inloggad</div>;
  }

  return <div>Välkommen {user.email}</div>;
}
