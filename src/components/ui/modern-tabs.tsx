"use client";

import React, { createContext, useContext, useState } from "react";
import { motion } from "framer-motion";

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface ModernTabsProps {
    children: React.ReactNode;
    defaultValue: string;
    className?: string;
    onTabChange?: (value: string) => void;
}

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

interface TabsTriggerProps {
    children: React.ReactNode;
    value: string;
    icon?: React.ReactNode;
    className?: string;
}

interface TabsContentProps {
    children: React.ReactNode;
    value: string;
    className?: string;
}

export const ModernTabs: React.FC<ModernTabsProps> = ({
    children,
    defaultValue,
    className = "",
    onTabChange
}) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        onTabChange?.(value);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
            <div className={className}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export const ModernTabsList: React.FC<TabsListProps> = ({ children, className = "" }) => {
    return (
        <div className={`inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1 ${className}`}>
            {children}
        </div>
    );
};

export const ModernTabsTrigger: React.FC<TabsTriggerProps> = ({
    children,
    value,
    icon,
    className = ""
}) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error("ModernTabsTrigger must be used within ModernTabs");
    }

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
        <button
            onClick={() => setActiveTab(value)}
            className={`relative inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
        >
            {isActive && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                    initial={false}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                    }}
                />
            )}

            <span className={`relative z-10 flex items-center gap-2 transition-colors ${
                isActive ? "text-white" : "text-gray-600 hover:text-gray-900"
            }`}>
                {icon && (
                    <motion.span
                        initial={false}
                        animate={{
                            scale: isActive ? 1.1 : 1,
                            rotate: isActive ? 360 : 0
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className={`flex items-center ${isActive ? "text-white" : ""}`}
                    >
                        {icon}
                    </motion.span>
                )}
                {children}
            </span>
        </button>
    );
};

export const ModernTabsContent: React.FC<TabsContentProps> = ({
    children,
    value,
    className = ""
}) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error("ModernTabsContent must be used within ModernTabs");
    }

    const { activeTab } = context;

    if (activeTab !== value) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                duration: 0.2,
                ease: "easeInOut"
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
