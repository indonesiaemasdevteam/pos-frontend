import CredentialProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { validateUser } from "@/lib/auth/validateUser"
import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialProvider({
      name: "Credentials",
      type: "credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          const creds = credentials as { email: string; password: string }
          const result = await validateUser(creds.email, creds.password, {
            includeToken: false,
          })

          if (result.error) return null
          return result.user
        } catch (e: any) {
          throw new Error(e.message)
        }
      },
    }),

    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge:   15 * 60, // 15 menit
  },

  pages: {
    signIn: "/login",
    signUp: "/register",
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.name   = user.name
        token.roles  = (user as any).roles
        token.status = (user as any).status
      }
      return token
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.name   = token.name  as string
        session.user.roles  = token.roles  as any
        session.user.status = token.status as string
      }
      return session
    },

    redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
}