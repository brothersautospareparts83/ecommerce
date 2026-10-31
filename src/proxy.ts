import { auth } from "@/lib/auth/server";

// Signed-out visitors are sent to /login before /account or /admin pages render.
// Pages and actions still re-check the session and role on the server.
export default auth.middleware({
  loginUrl: "/login",
  publicRoutes: ["/admin/login"],
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
