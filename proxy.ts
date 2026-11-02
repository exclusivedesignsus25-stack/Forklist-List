import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No pongas código entre createServerClient y getClaims
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  const { pathname } = request.nextUrl;
  const isLoginPage =
    pathname === "/admin/login" || pathname === "/usuario/login";

  if (!isLoggedIn && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/usuario")
      ? "/usuario/login"
      : "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/usuario/:path*"],
};
