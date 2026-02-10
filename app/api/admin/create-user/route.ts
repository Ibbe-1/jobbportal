import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  
  // Verifiera att användaren är admin
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
            // ignore
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Kolla om användaren är admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  // Hämta request body
  const body = await request.json()
  const { email, password, role } = body

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Skapa admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Skapa användare
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    console.error('Error creating user:', createError)
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  if (!newUser.user) {
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
  }

  // Uppdatera roll i users-tabellen
  const { error: updateError } = await supabase
    .from('users')
    .update({ role })
    .eq('user_id', newUser.user.id)

  if (updateError) {
    console.error('Error updating role:', updateError)
    return NextResponse.json({ 
      error: 'User created but role update failed: ' + updateError.message,
      user: newUser.user
    }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true,
    user: newUser.user,
    message: `User ${email} created with role ${role}`
  })
}