import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../services/auth'
import logo from '../assets/logo.png'
import { useAuth } from '../context/useAuth'

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `header-nav-link${isActive ? ' is-active' : ''}`

export default function HeaderNav() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading, error: authError } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError('')

    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      setSignOutError('Kunde inte logga ut. Försök igen.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="site-header">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand transition hover:text-white">
          Matrepot.
        </NavLink>

        <NavLink to="/" aria-label="Matrepot startsida" className="navbar-logo">
          <img src={logo} alt="" />
        </NavLink>

        <nav className="navbar-links" aria-label="Huvudnavigation">
          <NavLink to="/mina-receptlistor" className={linkClasses}>
            Mina receptlistor
            <span className="header-nav-indicator" aria-hidden="true" />
          </NavLink>

          <NavLink to="/alla-recept" className={linkClasses}>
            Mina recept
            <span className="header-nav-indicator" aria-hidden="true" />
          </NavLink>

            <NavLink to="/profil" className={linkClasses}>
            Profil
            <span className="header-nav-indicator" aria-hidden="true" />
          </NavLink>
          {!authLoading && user && (
            <button
              type="button"
              className="header-nav-logout"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Loggar ut...' : 'Logga ut'}
            </button>
          )}
        </nav>
        {(signOutError || authError) && (
          <p className="header-nav-error" role="alert">
            {signOutError || authError}
          </p>
        )}
      </div>
    </header>
  )
}
