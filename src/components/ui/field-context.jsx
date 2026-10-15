import { createContext, useContext } from "react";

export const FieldContext = createContext({ id: undefined, descriptionId: undefined, error: undefined });
export const useField = () => useContext(FieldContext);
