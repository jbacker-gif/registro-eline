import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Inicializamos el cliente del middleware de Supabase
    const supabase = createMiddlewareClient({ req, res });
    
    // Obtenemos la sesión actual del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Rutas protegidas (por ejemplo, el panel del maestro)
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        // Si no hay sesión, redirigimos a la página de inicio de sesión
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
  } catch (e) {
    console.error('Error al ejecutar el middleware de autenticación:', e);
  }

  return res;
}

// Configuración de las rutas que interceptará el middleware
export const config = {
  matcher: ['/dashboard/:path*', '/teacher/:path*'],
};
