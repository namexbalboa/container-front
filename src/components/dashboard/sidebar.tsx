"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Averbacoes", href: "/averbacoes", icon: ClipboardDocumentCheckIcon },
  { name: "Viagens", href: "/viagens", icon: TruckIcon },
  { name: "Containers", href: "/containers", icon: CubeIcon },
  { name: "Empresas", href: "/empresas", icon: BuildingOfficeIcon },
  { name: "Seguradoras", href: "/seguradoras", icon: BuildingOffice2Icon },
  { name: "Parametros", href: "/parametros", icon: WrenchScrewdriverIcon },
  { name: "Usuarios", href: "/usuarios", icon: UserGroupIcon },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function NavigationList({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <ul role="list" className="-mx-2 space-y-1">
      {navigation.map(item => {
        const isActive =
          pathname === item.href || (pathname && pathname.startsWith(`${item.href}/`));

        const baseClasses =
          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors";
        const activeClasses = "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]";
        const inactiveClasses =
          "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]";

        return (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              onClick={onNavigate}
            >
              <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 text-white"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[hsl(var(--card))] px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-sm font-bold text-white">
                        CI
                      </div>
                      <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
                        Cargo Insurance
                      </span>
                    </div>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <NavigationList pathname={pathname} onNavigate={() => setOpen(false)} />
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[hsl(var(--card))] px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-sm font-bold text-white">
                CI
              </div>
              <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Cargo Insurance
              </span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <NavigationList pathname={pathname} />
          </nav>
        </div>
      </div>
    </>
  );
}
