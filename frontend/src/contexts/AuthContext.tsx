import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/types/auth.types";
import { fetchCurrentUser, loginUser, registerUser } from "@/services/auth.service";
import { clearToken, getToken, setToken } from "@/utils/tokenStorage";
import { extractErrorMessage } from "@/utils/extractErrorMessage";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const defaultAuthContext: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
};

/**
 * Auth context. Holds the current user, exposes login/register/logout,
 * and restores the session from a stored JWT on first load.
 */
export const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount: if a token exists, validate it against
  // the backend and load the current user; otherwise skip straight to "logged out".
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        // Token was invalid or expired — the apiClient response
        // interceptor already cleared it.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user: loggedInUser, token } = await loginUser({ email, password });
      setToken(token);
      setUser(loggedInUser);
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Unable to log in"));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { user: registeredUser, token } = await registerUser({ name, email, password });
      setToken(token);
      setUser(registeredUser);
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Unable to create account"));
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Memoized so consumers (via useContext) only re-render when a field
  // they actually read changes, instead of on every AuthProvider render —
  // this context wraps the entire app, so an unmemoized value here would
  // cascade a re-render to every connected component on every auth-state
  // change, however unrelated.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
