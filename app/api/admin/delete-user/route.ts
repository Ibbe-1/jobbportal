import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function DELETE(request: Request) {
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

  // Hämta user_id från request
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // Förhindra att admin tar bort sig själv
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
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

  try {
    // 1. Ta bort från users-tabellen (detta triggar även cascade delete på jobs och candidates)
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId)

    if (deleteUsersError) {
      console.error('Error deleting from users table:', deleteUsersError)
      return NextResponse.json({ 
        error: 'Failed to delete from users table: ' + deleteUsersError.message 
      }, { status: 500 })
    }

    // 2. Ta bort från auth.users (den viktiga delen!)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Error deleting from auth:', deleteAuthError)
      return NextResponse.json({ 
        error: 'Failed to delete from auth: ' + deleteAuthError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'User completely deleted'
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error: ' + error.message 
    }, { status: 500 })
  }
}