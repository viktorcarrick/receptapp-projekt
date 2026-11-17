import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext, type AuthContextValue } from "./authContext";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (isMounted) {
        setUser(session?.user ?? null);
        setError(null);
        setIsLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (authEventReceived || !isMounted) {
        return;
      }
      if (sessionError) {
        throw sessionError;
      }

      setUser(data.session?.user ?? null);
      setError(null);
    }).catch((sessionError: unknown) => {
      if (!authEventReceived && isMounted) {
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Kunde inte läsa den sparade inloggningen."
        );
      }
    }).finally(() => {
      if (!authEventReceived && isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
