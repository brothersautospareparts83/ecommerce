import { createNeonAuth } from "@neon/auth/next/server";

/** Neon Auth (Managed Better Auth) server instance. Server-side only. */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
