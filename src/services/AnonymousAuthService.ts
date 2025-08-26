import { IAuthService } from '@/types/services/IAuthService';

const AnonymousAuthService: IAuthService = {
  async isAuthenticated(): Promise<boolean> {
    // Always return true for anonymous access - users are considered "authenticated" to access the portal
    return true;
  },

  async getAccessToken(): Promise<string> {
    // Return empty string for anonymous access since no token is needed
    return '';
  },

  async signIn(): Promise<void> {
    // No-op for anonymous access
    return Promise.resolve();
  },

  async signOut(): Promise<void> {
    // No-op for anonymous access
    return Promise.resolve();
  },
};

export default AnonymousAuthService;