import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSession = useCallback(async (options = {}) => {
    if (!authService.hasAccessToken()) {
      setUser(null);
      setError("");
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser(options);
      setUser(currentUser);
      setError("");
      return currentUser;
    } catch (requestError) {
      if (requestError.name === "AbortError") throw requestError;
      setUser(null);
      setError(
        [401, 403].includes(requestError.status)
          ? ""
          : requestError.message || "Unable to restore your MedLink session."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshSession({ signal: controller.signal }).catch(requestError => {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Unable to restore your MedLink session.");
      }
    });
    return () => controller.abort();
  }, [refreshSession]);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      setError("");
      setLoading(false);
    }
    window.addEventListener("medlink:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("medlink:unauthorized", handleUnauthorized);
  }, []);

  const runAuthentication = useCallback(async operation => {
    setLoading(true);
    try {
      const result = await operation();
      setUser(result.user);
      setError("");
      return result.user;
    } catch (requestError) {
      setUser(null);
      setError(requestError.message || "Authentication could not be completed.");
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(
    (email, password) => runAuthentication(() => authService.signIn(email, password)),
    [runAuthentication]
  );

  const signUp = useCallback(
    (email, password, profileId) =>
      runAuthentication(() => authService.signUp(email, password, profileId)),
    [runAuthentication]
  );

  const signOut = useCallback(async () => {
    authService.logout();
    setUser(null);
    setError("");
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    authenticated: Boolean(user),
    refreshSession,
    signIn,
    signUp,
    signOut
  }), [
    error,
    loading,
    refreshSession,
    signIn,
    signUp,
    signOut,
    user
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
