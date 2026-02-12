export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!api/auth|login|share|_next|favicon.ico|manifest.webmanifest|sw.js).*)"],
};
