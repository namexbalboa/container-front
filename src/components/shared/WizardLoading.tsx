"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import containerShipAnimation from "@/../public/container_ship.json";

interface WizardLoadingProps {
  isLoading: boolean;
}

export function WizardLoading({ isLoading }: WizardLoadingProps) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      setFadeOut(false);
    } else {
      // Inicia o fade out
      setFadeOut(true);
      // Remove o componente após a animação
      const timeout = setTimeout(() => {
        setShow(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        fadeOut ? "bg-white/0 backdrop-blur-none" : "bg-white/70 backdrop-blur-sm"
      }`}
    >
      <div
        className={`flex flex-col items-center transition-opacity duration-500 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-64 h-64">
          <Lottie
            animationData={containerShipAnimation}
            loop={true}
            autoplay={true}
          />
        </div>
        <p className="mt-2 text-gray-700 text-base font-semibold animate-pulse drop-shadow-sm">
          Processando...
        </p>
      </div>
    </div>
  );
}
