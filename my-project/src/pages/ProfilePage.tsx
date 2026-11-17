import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/useAuth';

export default function ProfilePage() {
  const { user, isLoading, error } = useAuth();

  if (isLoading) return <LoadingSpinner label="Hämtar profil..." className="app-content-enter" />;
  if (error) return <p role="alert" className="app-content-enter text-action-danger-text">{error}</p>;
  if (!user) return <p role="alert" className="text-action-danger-text">Ingen inloggad användare hittades.</p>;

  const fullName = user.user_metadata.full_name;
  const avatarUrl = user.user_metadata.avatar_url;
  const profileName = typeof fullName === 'string' ? fullName : '';
  const profileAvatar = typeof avatarUrl === 'string' ? avatarUrl : '';

  return (
    <div className="app-content-enter mx-auto flex max-w-full flex-col items-center justify-center px-4 text-app-ink">
            <div className="flex flex-col items-center justify-center mt-12">
            {profileAvatar && (
                <img
                    src={profileAvatar}
                    alt="Profilbild"
                    className="w-24 h-24 rounded-full"
                />
            )}

            <h1 className="text-4xl font-semibold self-start text-app-ink">{profileName}</h1>
            <p className="text-lg self-start">Registrerad email: {user.email || ''}</p>
        </div>
    </div>
  )
}
