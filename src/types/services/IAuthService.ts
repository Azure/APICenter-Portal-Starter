export interface IAuthService {
  isAuthenticated(): Promise<boolean>;
  getAccessToken(): Promise<string>;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}
