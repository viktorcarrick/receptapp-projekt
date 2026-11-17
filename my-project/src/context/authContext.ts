import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
