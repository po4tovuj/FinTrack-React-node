import 'next-auth';

/**
 * Extended NextAuth types to include custom properties
 */
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    id?: string;
  }
}