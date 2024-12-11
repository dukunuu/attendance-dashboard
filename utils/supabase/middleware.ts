import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

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
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const path = request.nextUrl.pathname;
    if (path.startsWith("/api/")) {
      return NextResponse.next();
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    const isAuthPage =
      path === "/sign-in" ||
      path === "/sign-up" ||
      path === "/forgot-password" ||
      path.includes("/attendances");

    // protected routes
    if (!isAuthPage && error && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const { data: profile } = await supabase
      .from("users")
      .select()
      .eq("id", user!.id)
      .single<User>();
    const checkProfileCompletion =
      profile?.first_name && profile?.last_name && profile?.image_url;

    if (isAuthPage && !checkProfileCompletion) {
      return NextResponse.redirect(new URL("/auth/profile", request.url));
    }
    if (!isAuthPage && !checkProfileCompletion && path !== "/auth/profile") {
      return NextResponse.redirect(new URL("/auth/profile", request.url));
    }
    if ((isAuthPage || path === "/auth/profile") && checkProfileCompletion) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
