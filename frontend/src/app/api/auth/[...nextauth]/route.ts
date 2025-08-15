import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

/**
 * NextAuth configuration for JWT authentication with GraphQL backend
 */
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call GraphQL login mutation
          const response = await fetch(process.env.GRAPHQL_URL || 'http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                mutation Login($input: LoginInputType!) {
                  login(input: $input) {
                    user {
                      id
                      email
                      name
                      avatar
                    }
                    token
                    refreshToken
                  }
                }
              `,
              variables: {
                input: {
                  email: credentials.email,
                  password: credentials.password,
                },
              },
            }),
          });

          const result = await response.json();
          
          if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            return null;
          }

          const { user, token, refreshToken } = result.data.login;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            accessToken: token,
            refreshToken: refreshToken,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET 
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []
    ),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.id = user.id;
      }

      // Handle Google OAuth
      if (account?.provider === 'google') {
        try {
          // Call GraphQL mutation to register/login with Google
          const response = await fetch(process.env.GRAPHQL_URL || 'http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                mutation GoogleAuth($email: String!, $name: String!, $avatar: String) {
                  googleAuth(email: $email, name: $name, avatar: $avatar) {
                    user {
                      id
                      email
                      name
                      avatar
                    }
                    token
                    refreshToken
                  }
                }
              `,
              variables: {
                email: user?.email,
                name: user?.name,
                avatar: user?.image,
              },
            }),
          });

          const result = await response.json();
          
          if (!result.errors) {
            const { user: dbUser, token: jwt, refreshToken } = result.data.googleAuth;
            token.accessToken = jwt;
            token.refreshToken = refreshToken;
            token.id = dbUser.id;
          }
        } catch (error) {
          console.error('Google auth error:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };