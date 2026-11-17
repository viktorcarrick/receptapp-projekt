import { supabase } from "../lib/supabase";

/** Hämtar den inloggade användaren. Kastar ett fel om Supabase-anropet misslyckas. */
export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return data.user;
}

/** Hämtar inloggad användare eller kastar det angivna felet om session saknas. */
export async function requireCurrentUser(message: string) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error(message);
    }

    return user;
}

/** Loggar ut den aktuella användaren från Supabase-sessionen. */
export async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}
