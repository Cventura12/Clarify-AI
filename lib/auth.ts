import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: getEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) {
        return false;
      }

      const dbUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        },
        create: {
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        },
      });

      if (account?.access_token) {
        await prisma.integration.upsert({
          where: {
            provider_userId: {
              provider: "google",
              userId: dbUser.id,
            },
          },
          update: {
            status: "connected",
            metadata: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? null,
              expiresAt: account.expires_at
                ? new Date(account.expires_at * 1000).toISOString()
                : null,
              scope: account.scope ?? null,
              calendarId: "primary",
              refreshedAt: new Date().toISOString(),
            },
          },
          create: {
            provider: "google",
            status: "connected",
            userId: dbUser.id,
            metadata: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? null,
              expiresAt: account.expires_at
                ? new Date(account.expires_at * 1000).toISOString()
                : null,
              scope: account.scope ?? null,
              calendarId: "primary",
              refreshedAt: new Date().toISOString(),
            },
          },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        token.userId = dbUser?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
