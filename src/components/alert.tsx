"use client";

import { Fragment, useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

type AlertType = "success" | "error";

interface AlertProps {
  type: AlertType;
  message: string;
  onClose: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // Aguarda a animação terminar
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        <Transition
          show={show}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            type === "success" 
              ? "bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20" 
              : "bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/20"
          }`}>
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {type === "success" ? (
                    <CheckCircleIcon className="h-6 w-6 text-[hsl(var(--success))]" aria-hidden="true" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-[hsl(var(--destructive))]" aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className={`text-sm font-medium ${
                    type === "success" 
                      ? "text-[hsl(var(--success))]" 
                      : "text-[hsl(var(--destructive))]"
                  }`}>
                    {message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    type="button"
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      type === "success"
                        ? "text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10 focus:ring-[hsl(var(--success))]"
                        : "text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 focus:ring-[hsl(var(--destructive))]"
                    }`}
                    onClick={() => {
                      setShow(false);
                      setTimeout(onClose, 300);
                    }}
                  >
                    <span className="sr-only">Fechar</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <div className={`h-1 w-full ${
              type === "success" 
                ? "bg-[hsl(var(--success))]" 
                : "bg-[hsl(var(--destructive))]"
            }`}>
              <div 
                className={`h-full ${
                  type === "success" 
                    ? "bg-[hsl(var(--success))]" 
                    : "bg-[hsl(var(--destructive))]"
                }`}
                style={{
                  width: '100%',
                  animation: 'shrink 5s linear forwards'
                }}
              />
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
} 