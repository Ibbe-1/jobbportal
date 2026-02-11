import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  
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

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, role } = body

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

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

  try {
    // 1. Skapa användare i auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    // 2. Skapa användare i users-tabellen (med admin client för att bypass RLS)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        user_id: newUser.user.id,
        email: email,
        role: role,
      })

    if (insertError) {
      console.error('Error inserting into users table:', insertError)
      
      // Om det misslyckas, ta bort auth-användaren
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      
      return NextResponse.json({ 
        error: 'Failed to create user profile: ' + insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      user: newUser.user,
      message: `User ${email} created with role ${role}`
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error: ' + error.message 
    }, { status: 500 })
  }
}