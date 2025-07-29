"use client";
import React, { useState } from "react";
import { useTheme, ThemeColor, ThemeMode } from "@/shared/utils/useTheme";

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className = "" }: ThemeSelectorProps) {
  const { theme, setMode, setColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const theModes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light", label: "Claro", icon: "light_mode" },
    { value: "dark", label: "Oscuro", icon: "dark_mode" },
    { value: "auto", label: "Auto", icon: "brightness_auto" }
  ];

  const colorOptions: { value: ThemeColor; label: string; colorClass: string }[] = [
    { value: "crimson", label: "Carmesí", colorClass: "bg-red-700" },
    { value: "blue", label: "Azul", colorClass: "bg-blue-600" },
    { value: "green", label: "Verde", colorClass: "bg-emerald-600" },
    { value: "purple", label: "Morado", colorClass: "bg-purple-600" },
    { value: "orange", label: "Naranja", colorClass: "bg-orange-600" },
    { value: "pink", label: "Rosa", colorClass: "bg-pink-600" }
  ];

  const isFullWidth = className.includes("w-full");

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal del tema */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center rounded-xl transition-all duration-200 bg-primary/10 hover:bg-primary hover:text-white theme-transition shadow-md hover:shadow-lg ${
          isFullWidth ? "w-full py-4 px-4 gap-3 justify-start text-base font-semibold min-h-[52px]" : "w-12 h-12 justify-center"
        }`}
        aria-label="Configurar tema"
      >
        <span className="material-icons text-xl flex-shrink-0 text-primary group-hover:text-white">
          palette
        </span>
        {isFullWidth && (
          <span className="text-primary group-hover:text-white font-medium">
            Personalizar Tema
          </span>
        )}
      </button>

      {/* Panel de configuración */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <div className={`
            fixed z-50 w-80 max-w-[90vw] bg-card border border-app rounded-xl shadow-xl theme-transition
            ${isFullWidth 
              ? 'top-20 right-4' // sidebar expandido
              : 'top-20 left-20' // sidebar colapsado
            }
          `}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card">Configuración de Tema</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="material-icons text-lg text-muted">close</span>
                </button>
              </div>

              {/* Selector de modo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-card mb-3">
                  Modo de Apariencia
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {theModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setMode(mode.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all theme-transition ${
                        theme.mode === mode.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-app bg-muted text-muted hover:border-primary/50'
                      }`}
                    >
                      <span className="material-icons text-lg">{mode.icon}</span>
                      <span className="text-xs font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de color */}
              <div>
                <label className="block text-sm font-medium text-card mb-3">
                  Color Principal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setColor(color.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all theme-transition ${
                        theme.color === color.value
                          ? 'border-primary bg-primary/10'
                          : 'border-app bg-muted hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${color.colorClass} ring-2 ring-white shadow-md`} />
                      <span className="text-xs font-medium text-card">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón de reset */}
              <div className="mt-6 pt-4 border-t border-app">
                <button
                  onClick={() => {
                    setMode('light');
                    setColor('crimson');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-muted hover:text-card hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="material-icons text-sm">restore</span>
                  Restaurar valores por defecto
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
