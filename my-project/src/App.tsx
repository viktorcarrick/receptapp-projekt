import './App.css'
import './index.css'
import HeaderNav from './components/HeaderNav'
import backgroundLogo from './assets/kokmarke_bg_icon.svg'
import { Routes, Route } from 'react-router-dom'

import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import MyListsPage from './pages/MyListsPage'
import AllRecipesPage from './pages/AllRecipesPage'
import AddRecipePage from './pages/AddRecipePage'
import SingleRecipePage from './pages/SingleRecipePage'

function App() {
  return (
    <div className="app-shell flex min-h-screen w-full min-w-0 flex-col bg-app-canvas text-app-ink">
      <HeaderNav />
      <div className="gingham-border" aria-hidden="true" />

      <main className="app-main relative isolate flex min-w-0 flex-1 flex-col p-8">
        <img
          src={backgroundLogo}
          alt=""
          aria-hidden="true"
          className="app-background-logo pointer-events-none z-0 h-[min(80vw,80vh)] w-[min(80vw,80vh)] select-none object-contain opacity-40"
        />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/mina-receptlistor" element={<MyListsPage />} />
            <Route path="/alla-recept" element={<AllRecipesPage />} />
            <Route path="/lagg-till-recept" element={<AddRecipePage />} />
            <Route path="/recept/:recipeId" element={<SingleRecipePage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
