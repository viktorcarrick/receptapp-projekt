import { NavLink, useLocation } from 'react-router-dom'
import type { Recipe } from '../types/Recipe'
import GenericButton from './GenericButton'

type ListCardProps = {
  title: string
  items: Recipe[]
  actionLabel: string
}

export default function ListCard({ title, items, actionLabel }: ListCardProps) {
  const location = useLocation()

  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
      <h2 className="text-left text-xl font-semibold text-slate-100">{title}</h2>
      <ul className="mt-4 divide-y divide-slate-800 text-slate-300">
        {items.map(recipe => (
          <li key={recipe.id} className="rounded-xl px-3 py-3 transition-colors duration-200 hover:cursor-pointer hover:bg-slate-800 hover:text-slate-50">
            <NavLink to={`/recept/${recipe.id}`} state={{ recipe, from: location.pathname }}>
              {recipe.name}
            </NavLink>
          </li>
        ))}
        <li className="mt-3">
          <GenericButton
            to="/alla-recept"
            label={actionLabel}
            className="w-full rounded-2xl"
          />
        </li>
      </ul>
    </div>
  )
}
