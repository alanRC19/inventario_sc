"use client";
import Link from "next/link";
import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HamburgerIcon } from "@/shared/components/HamburgerIcon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SIDEBAR_LINKS = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/inventario", icon: "inventory_2", label: "Inventario" },
  { href: "/categorias", icon: "svg-categorias", label: "Categorías" },
  { href: "/proveedores", icon: "svg-proveedores", label: "Proveedores" },
  { href: "/ventas", icon: "point_of_sale", label: "Ventas" },
  { href: "/reportes", icon: "bar_chart", label: "Reportes" },
  { href: "/alertas", icon: "warning", label: "Alertas" },
  { href: "/usuarios", icon: "group", label: "Usuarios" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fafafa] text-black`}>
        <div className="flex">
          {/* Sidebar */}
          <aside
            className={`
              fixed top-0 left-0 z-30 h-screen
              ${sidebarOpen ? 'w-60' : 'w-16'}
              bg-white border-r border-[#ececec] flex flex-col py-8 px-2 shadow-sm transition-all duration-200
              items-center
            `}
            style={{ minWidth: sidebarOpen ? 240 : 64 }}
          >
            <div className="mb-10 flex items-center justify-center w-full">
              <HamburgerIcon open={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} />
              {sidebarOpen && (
                <span className="ml-3 text-xl font-bold tracking-tight text-black">Sistema de Inventario</span>
              )}
            </div>
            <nav className="flex-1 w-full">
              <ul className="space-y-1">
                {SIDEBAR_LINKS.map(link => (
                  <li key={link.href} className="relative group">
                    <Link
                      href={link.href}
                      className={`flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded-lg hover:bg-[#f3f4f6] transition text-base font-medium text-black`}
                    >
                      <span className="text-black">
                        {link.icon === "svg-categorias" && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M4 10h16" stroke="currentColor" strokeWidth="2" /></svg>
                        )}
                        {link.icon === "svg-proveedores" && (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M16 13V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1" stroke="currentColor" strokeWidth="2" />
                            <rect x="16" y="13" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                            <circle cx="7.5" cy="19" r="1.5" stroke="currentColor" strokeWidth="2" />
                            <circle cx="18.5" cy="19" r="1.5" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        )}
                        {link.icon !== "svg-categorias" && link.icon !== "svg-proveedores" && (
                          <span className={`material-icons ${sidebarOpen ? 'text-lg' : 'text-base'} text-black`}>{link.icon}</span>
                        )}
                      </span>
                      {sidebarOpen && link.label}
                    </Link>
                    {!sidebarOpen && (
                      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          {/* Sidebar móvil */}
          {mobileSidebar && (
            <div className="fixed inset-0 z-50 flex">
              <aside className="w-60 bg-white border-r border-[#ececec] flex flex-col py-8 px-3 shadow-sm h-full">
                <div className="mb-10 flex items-center gap-2 px-2">
                  <HamburgerIcon open={true} onClick={() => setMobileSidebar(false)} />
                  <span className="text-xl font-bold tracking-tight text-black">Sistema de Inventario</span>
                </div>
                <nav className="flex-1">
                  <ul className="space-y-1">
                    {SIDEBAR_LINKS.map(link => (
                      <li key={link.href}>
                        <Link href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f3f4f6] transition text-base font-medium text-black" onClick={() => setMobileSidebar(false)}>
                          <span className="material-icons text-lg text-black">{link.icon}</span>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
              <div className="flex-1 bg-black bg-opacity-30" onClick={() => setMobileSidebar(false)} />
            </div>
          )}
          {/* Main content wrapper */}
          <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: sidebarOpen ? 240 : 64, transition: 'margin-left 0.2s' }}>
            {/* Topbar */}
            <header className="h-16 bg-white shadow-sm flex items-center px-4 md:px-8 border-b border-[#ececec] fixed w-full left-0 z-40" style={{ marginLeft: sidebarOpen ? 240 : 64, transition: 'margin-left 0.2s' }}>
              {/* Botón menú para móvil y desktop */}
              <img
                src="/sc_logo.png"
                alt="Abrir menú"
                className="w-8 h-8 rounded-full object-cover cursor-pointer mr-4 md:hidden"
                onClick={() => setMobileSidebar(true)}
              />
              <img
                src="/sc_logo.png"
                alt="Abrir/cerrar menú"
                className="w-8 h-8 rounded-full object-cover cursor-pointer mr-4 hidden md:block"
                onClick={() => setSidebarOpen((v) => !v)}
              />
              <span className="text-2xl font-bold tracking-tight text-black">Sagrado Corazón de Jesús</span>
              <div className="flex-1" />
            </header>
            {/* Main content */}
            <main className="flex-1 p-8 bg-[#fafafa] transition-all duration-200" style={{ marginTop: 64 }}>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
