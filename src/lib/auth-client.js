import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const authClient = createAuthClient({
  baseURL: apiUrl.replace("/api", ""), // usually http://localhost:5000
  fetchOptions: {
    credentials: "include", // MUST: send cookies with every request
  },
  plugins: [
    jwtClient(), // JWT টোকেন রিট্রাইভ করার জন্য authClient.token() মেথড সক্রিয় হবে
  ],
});
