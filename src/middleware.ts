import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Crear el cliente de Supabase para el middleware
    const supabase = createMiddlewareClient({ req, res });
    
    // Obtener la sesión actual
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Rutas protegidas (por ejemplo, el panel de maestros)
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        // Si no hay sesión, redirige al login
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
  } catch (e) {
    // En caso de error, permitir que el usuario intente iniciar sesión
    console.error('Error en el middleware:', e);
  }

  return res;
}

// Configuración de las rutas donde actuará el middleware
export const config = {
  matcher: ['/dashboard/:path*', '/teacher/:path*'],
};
