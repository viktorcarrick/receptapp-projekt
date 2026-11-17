export interface Recipe {
    id: string;
    user_id: string | null;
    name: string;
    ingredients: string[];
    instructions: string[];
    time: string;
    no_of_portions: number;
}