"use client";

import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import { SearchQuick, SearchAdvanced } from "@/components/search";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ setSidebarOpen }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Atalhos de teclado
  useKeyboardShortcuts({
    onSearchOpen: () => setIsSearchOpen(true)
  });

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Abrir menu</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separador */}
      <div className="h-6 w-px bg-[hsl(var(--border))] lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center justify-center max-w-lg mx-auto">
          <SearchQuick 
            onOpenAdvanced={(term) => setIsSearchOpen(true)}
            placeholder="Buscar containers, averbações, clientes..."
            className="w-full max-w-md"
          />
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Menu do usuário */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="sr-only">Abrir menu do usuário</span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm hover:shadow-md transition-shadow">
                U
              </div>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white border border-gray-200 shadow-xl focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className={`
                        block px-4 py-2.5 text-sm w-full text-left transition-colors rounded-md
                        ${active
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700'
                        }
                      `}
                    >
                      Sair
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Modal de Busca Avançada */}
      <SearchAdvanced 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
