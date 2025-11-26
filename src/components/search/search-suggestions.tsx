"use strict";

import React from "react";
import { MagnifyingGlassIcon, ClockIcon } from "@heroicons/react/24/outline";

interface SearchSuggestion {
    id: string;
    text: string;
    type: "recent" | "suggestion" | "popular";
    category?: string;
}

interface SearchSuggestionsProps {
    suggestions: SearchSuggestion[];
    onSuggestionClick: (suggestion: SearchSuggestion) => void;
    isVisible: boolean;
    className?: string;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
    suggestions,
    onSuggestionClick,
    isVisible,
    className = ""
}) => {
    if (!isVisible || suggestions.length === 0) {
        return null;
    }

    const getIcon = (type: SearchSuggestion["type"]) => {
        switch (type) {
            case "recent":
                return <ClockIcon className="h-4 w-4 text-muted-foreground" />;
            default:
                return <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getTypeLabel = (type: SearchSuggestion["type"]) => {
        switch (type) {
            case "recent":
                return "Recente";
            case "popular":
                return "Popular";
            case "suggestion":
                return "Sugestão";
            default:
                return "";
        }
    };

    return (
        <div className={`absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto ${className}`}>
            <div className="py-2">
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion.id}
                        className="w-full px-4 py-2 text-left hover:bg-muted transition-colors duration-150 flex items-center gap-3"
                        onClick={() => onSuggestionClick(suggestion)}
                    >
                        {getIcon(suggestion.type)}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">
                                {suggestion.text}
                            </div>
                            {suggestion.category && (
                                <div className="text-xs text-muted-foreground">
                                    {suggestion.category}
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {getTypeLabel(suggestion.type)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchSuggestions;
export type { SearchSuggestion, SearchSuggestionsProps };