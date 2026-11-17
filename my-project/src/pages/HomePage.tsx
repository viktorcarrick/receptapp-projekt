
import { supabase } from '../lib/supabase';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import { useState } from 'react';
import GenericButton from "../components/GenericButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { FaGoogle } from "react-icons/fa";
import { FaListUl, FaPlus, FaShuffle } from "react-icons/fa6";
import { useAuth } from "../context/useAuth";

/**
 * TODO: Fixa edgefunction supabase gemini api key. Denna ska inte ligga i frontend.
 * Fixa repo på github och deploya.
 * Snygga till denna sida.
 * Kanske göra en om oss?
 * Snygga till profilsidan.
 */

export default function HomePage() {
    const [loading, setLoading] = useState(false);
    const { user, isLoading: authLoading } = useAuth();
    const fullName = user?.user_metadata.full_name;
    const userName = typeof fullName === "string" ? fullName : "";

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString()
                }
            });

            if (error) {
                console.error('Error signing in with Google:', error);
                setLoading(false);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
            <section className="app-content-enter justify-items-center w-full rounded-xl border border-app-border bg-app-surface/90 p-6 text-left shadow-[0_1px_3px_rgba(120,80,40,0.12)] sm:p-10">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-olive">
                    {userName ? `Välkommen tillbaka, ${userName}` : "Välkommen till Receptappen"}!
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-app-ink sm:text-5xl mb-2">
                    Vad blir det för gott idag?
                </h1>
                <p className="mt-4 max-w-2xl text-app-muted">
                    Samla dina favoritrecept, upptäck nya favoriter och planera veckans måltider. Allt på ett och samma ställe.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 mb-8">
                    <GenericButton
                        to="/lagg-till-recept"
                        label="Skapa recept"
                        icon={<FaPlus aria-hidden="true" />}
                        className="min-h-12 px-5"
                    />
                    <GenericButton
                        to="/mina-receptlistor"
                        state={{ popup: "create" }}
                        label="Skapa lista"
                        variant="olive"
                        icon={<FaListUl aria-hidden="true" />}
                        className="min-h-12 px-5"
                    />
                    <GenericButton
                        to="/mina-receptlistor"
                        state={{ popup: "randomize" }}
                        label="Slumpa lista"
                        variant="accent"
                        icon={<FaShuffle aria-hidden="true" />}
                        className="min-h-12 px-5"
                    />
                </div>
                {authLoading ? (
                    <LoadingSpinner label="Laddar..." className="py-2" />
                ) : user ? (
                    <>
                        <p className="mt-2 text-app-muted">
                            Strul? Maila vaktmästare/CEO/utvecklare/receptmästare på viktor.carrick00@gmail.com
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold tracking-tight text-app-ink">
                            Logga in för att skapa och se recept
                        </h2>
                        <div className="mt-5 flex justify-center">
                            <GenericButton
                                label={loading ? 'Omdirigerar...' : 'Logga in'}
                                icon={<FaGoogle aria-hidden="true" className="text-lg" />}
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="h-12 min-w-36 px-6 font-semibold"
                            />
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
