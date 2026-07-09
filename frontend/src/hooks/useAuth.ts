import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

/**
 * Reads the current auth state (user, isAuthenticated, isLoading)
 * and the login/register/logout actions from AuthContext.
 */
export const useAuth = () => useContext(AuthContext);
