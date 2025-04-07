import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define paths that require authentication
const protectedPaths = [
  "/tierlist",
  "/users",
  "/profile",
];

// Define paths that are always accessible (public)
const publicPaths = [
  "/",
  "/api", 
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is in the list of protected paths
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Skip middleware for public paths
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtectedPath || isPublicPath) {
    return NextResponse.next();
  }

  // Get the user token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If there is no token and the path is protected, redirect to home with auth prompt
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}; 