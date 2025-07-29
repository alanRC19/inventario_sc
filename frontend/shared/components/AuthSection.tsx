"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/contexts/AuthContext';

const AuthSection: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // Contenedor/botón base - mismas clases para todos los casos
  const baseClasses = "inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer max-w-[180px] truncate";

  // Loading state
  if (isLoading) {
    return (
      <div className={`${baseClasses} cursor-not-allowed opacity-75`}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  // Sin usuario - botón de login
  if (!user) {
    return (
      <button onClick={handleLogin} className={baseClasses}>
        Iniciar sesión
      </button>
    );
  }

  // Con usuario - contenedor con info + botón logout
  return (
    <div className="flex items-center bg-white border border-gray-300 rounded-md max-w-[200px] overflow-hidden text-xs">
      {/* Info del usuario */}
      <div className="px-2 py-1.5 text-gray-700 border-r border-gray-300 flex-1 min-w-0">
        <div className="truncate">
          <span className="font-medium">{user.nombre}</span>
          <span className="text-gray-500 ml-1">({user.role === 'admin' ? 'Admin' : 'User'})</span>
        </div>
      </div>
      
      {/* Botón cerrar sesión */}
      <button
        onClick={handleLogout}
        className="px-2 py-1.5 font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0 whitespace-nowrap"
      >
        Salir
      </button>
    </div>
  );
};

export default AuthSection;
