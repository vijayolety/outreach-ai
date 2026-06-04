// web/src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

// Protect all routes inside these paths
export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/campaigns/:path*",
        "/settings/:path*",
        "/leads/:path*",
        "/ai-eval/:path*",
        "/profile/:path*",
    ],

};