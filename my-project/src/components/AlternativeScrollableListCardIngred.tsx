import { IoTrashBin } from "react-icons/io5";
import type { EditableListItem } from "../hooks/useEditableList";

type AlternativeScrollableListCardProps = {
  title: string
  items: EditableListItem[]
  removeItem?: (itemId: string) => void
}

export default function AlternativeScrollableListCard({ title, items, removeItem }: AlternativeScrollableListCardProps) {
  return (
    <div className="recipe-scroll max-h-150 overflow-y-auto rounded border border-app-border bg-white/90 p-4 pr-2 shadow-lg shadow-slate-950/10 backdrop-blur-xl">
    <h2 className="text-left text-lg font-semibold text-app-ink">
        {title}
    </h2>

    <ul className="mt-4 mr-2 divide-y divide-app-border-soft text-app-subtle">
        {items.map((entry) => (
        <li
            key={entry.id}
            className="flex flex-row items-center justify-between px-3 py-3 transition-colors duration-200 "
        >
            {entry.value}
            {removeItem && (
                <IoTrashBin 
                    className="cursor-pointer text-black hover:text-action-danger-text" 
                    onClick={(e) => {
                        e.stopPropagation();
                        removeItem(entry.id);
                    }} 
                />
            )}
        </li>
        ))}
    </ul>
    </div>
  )
}
