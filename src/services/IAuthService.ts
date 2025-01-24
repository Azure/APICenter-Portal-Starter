export interface IAuthService {
  /**
   * Checks if the user is authenticated.
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Gets the access token.
   */
  getAccessToken(): Promise<string>;

  /**
   * Signs the user in.
   */
  signIn(): Promise<void>;

  /**
   * Signs the user out.
   */
  signOut(): Promise<void>;
}
