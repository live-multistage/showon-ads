// Mirrors AuthController's /auth/login and /auth/register response shapes
// (live-show-orchestrator src/account/application/use-cases/{login,register}.use-case.ts):
// both endpoints authenticate immediately and return the same envelope.
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
}
