import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // VIKTIGT: refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  console.log('=== PROXY ===', {
    pathname,
    hasUser: !!user,
    email: user?.email,
    cookies: request.cookies.getAll().map(c => c.name)
  })

  // Skyddade routes - kräver inloggning
  const protectedRoutes = ['/dashboard', '/jobs', '/candidates', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Om användaren inte är inloggad och försöker nå skyddad route
  if (isProtectedRoute && !user) {
    console.log('❌ Access denied - redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Om användaren är inloggad och försöker nå login-sidan, skicka till dashboard
  if (pathname === '/login' && user) {
    console.log('✅ Already logged in - redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('✅ Access granted')
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}