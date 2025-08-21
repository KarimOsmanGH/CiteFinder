import NextAuth from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { Resend } from 'resend'

// Check if we have the minimum required environment variables
const hasRequiredEnvVars = process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL

const handler = NextAuth({
  providers: [
    // Only add Google provider if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),

    // Only add Email provider if Resend is configured
    ...(process.env.RESEND_API_KEY ? [
      EmailProvider({
        server: {
          host: 'smtp.resend.com',
          port: 587,
          auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY,
          },
        },
        from: process.env.EMAIL_FROM || 'noreply@citefinder.app',
        sendVerificationRequest: async ({ identifier, url, provider }) => {
          const resend = new Resend(process.env.RESEND_API_KEY)
          
          try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'noreply@citefinder.app',
              to: identifier,
              subject: 'Sign in to CiteFinder',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">CiteFinder</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Sign in to your account</p>
                  </div>
                  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #333; margin: 0 0 20px 0;">Welcome back!</h2>
                    <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
                      Click the button below to sign in to your CiteFinder account. This link will expire in 24 hours.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Sign In to CiteFinder
                      </a>
                    </div>
                    <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                      CiteFinder - AI-Powered Academic Source Finder
                    </p>
                  </div>
                </div>
              `,
            })
          } catch (error) {
            console.error('Error sending email:', error)
            throw new Error('Failed to send email')
          }
        },
      })
    ] : []),
  ],
  // Only use Supabase adapter if configured
  adapter: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 
    SupabaseAdapter({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }) : undefined,
  callbacks: {
    async session({ session, user }) {
      if (session?.user) {
        (session.user as any).id = user.id
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Add custom error page
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  // Add debug mode for development
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST } 