"use strict";

import React, { createContext, useContext, useState } from "react";

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
    children: React.ReactNode;
    defaultValue: string;
    className?: string;
}

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

interface TabsTriggerProps {
    children: React.ReactNode;
    value: string;
    className?: string;
}

interface TabsContentProps {
    children: React.ReactNode;
    value: string;
    className?: string;
}

const Tabs: React.FC<TabsProps> = ({ children, defaultValue, className = "" }) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

const TabsList: React.FC<TabsListProps> = ({ children, className = "" }) => {
    return (
        <div className={`inline-flex h-12 items-center justify-center rounded-lg bg-gray-100 p-1.5 text-gray-500 shadow-inner ${className}`}>
            {children}
        </div>
    );
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, value, className = "" }) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error("TabsTrigger must be used within a Tabs component");
    }

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
        <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                isActive
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            } ${className}`}
            onClick={() => setActiveTab(value)}
        >
            {children}
        </button>
    );
};

const TabsContent: React.FC<TabsContentProps> = ({ children, value, className = "" }) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error("TabsContent must be used within a Tabs component");
    }

    const { activeTab } = context;
    
    if (activeTab !== value) {
        return null;
    }

    return (
        <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
            {children}
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps };