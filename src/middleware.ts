import { withAuth } from "next-auth/middleware";

// نوجّه غير المسجّل إلى /login فقط في الصفحات الحساسة (مو /chat)
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/account",
    "/vip",
    "/billing/:path*",
    "/checkout/:path*",
  ],
};
