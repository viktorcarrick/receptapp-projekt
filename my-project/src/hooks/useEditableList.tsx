import { useState } from "react";

export type EditableListItem = {
    id: string;
    value: string;
};

/** Manages editable list values while keeping a unique ID for each row. */
export function useEditableList(initialItems: string[] = []) {
    const [inputValue, setInputValue] = useState("");
    const [items, setItems] = useState<EditableListItem[]>(() =>
        initialItems.map((value) => ({ id: crypto.randomUUID(), value }))
    );

    const handleAddItem = () => {
        const value = inputValue.trim();
        if (!value) {
            return;
        }

        setItems((items) => [
            ...items,
            { id: crypto.randomUUID(), value },
        ]);
        setInputValue("");
    };

    const handleRemoveItem = (itemId: string) => {
        setItems((items) => items.filter((item) => item.id !== itemId));
    };

    const setValues = (values: string[]) => {
        setItems(values.map((value) => ({ id: crypto.randomUUID(), value })));
        setInputValue("");
    };

    return { inputValue, setInputValue, items, handleAddItem, handleRemoveItem, setValues };
}