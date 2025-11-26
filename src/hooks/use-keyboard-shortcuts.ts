"use client";
"use strict";

import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
    onSearchOpen: () => void;
}

export function useKeyboardShortcuts({ onSearchOpen }: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
            if ((event.metaKey || event.ctrlKey) && event.key === "k") {
                event.preventDefault();
                onSearchOpen();
            }
            
            // Esc para fechar modais (pode ser usado pelos componentes)
            if (event.key === "Escape") {
                // Deixar que os componentes individuais lidem com isso
                return;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onSearchOpen]);
}