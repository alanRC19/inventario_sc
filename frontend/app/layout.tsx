"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";
import { ThemeSelector } from "@/shared/components/ThemeSelector";
import { HamburgerIcon } from "@/shared/components/HamburgerIcon";
import { jwtDecode } from "jwt-decode";
import { usePathname } from "next/navigation";

const THEME_KEY = "theme";

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
  
  { href: "/usuarios", icon: "group", label: "Usuarios" },
];

type UsuarioJWT = { nombre: string; rol: string; email: string; _id: string };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Obtener usuario del token (cliente)
  const [usuario, setUsuario] = useState<UsuarioJWT | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tokenVersion, setTokenVersion] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          setUsuario(jwtDecode<UsuarioJWT>(token));
        } catch {
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
      setAuthReady(true);
    }
    // Escuchar cambios en el token (login/logout en otras pestañas o tras login)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") {
        setTokenVersion(v => v + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Forzar resize tras la animación del sidebar
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 210); // 200ms de la animación + margen
    return () => clearTimeout(timeout);
  }, [sidebarOpen]);

  // Sidebar links según rol
  let filteredLinks: typeof SIDEBAR_LINKS = [];
  if (!authReady) {
    // Mientras no se sabe el rol, no mostrar nada (o solo un loader si se desea)
    filteredLinks = [];
  } else if (usuario && usuario.rol !== "admin") {
    // Para usuarios no admin: Dashboard específico, Inventario y Ventas
    filteredLinks = [
      { href: "/dashboard/usuario", icon: "dashboard", label: "Dashboard" },
      { href: "/inventario", icon: "inventory_2", label: "Inventario" },
      { href: "/ventas", icon: "point_of_sale", label: "Ventas" }
    ];
  } else {
    // Para admin: Dashboard específico y todos los enlaces
    filteredLinks = [
      { href: "/dashboard/admin", icon: "dashboard", label: "Dashboard" },
      ...SIDEBAR_LINKS.slice(1) // Todos excepto el primer dashboard genérico
    ];
  }

  const pathname = usePathname();
  const hideNav = pathname === "/auth";

  const [darkMode, setDarkMode] = useState(false);

  // Leer preferencia de tema
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark") {
        setDarkMode(true);
        document.body.classList.add("dark");
      } else {
        setDarkMode(false);
        document.body.classList.remove("dark");
      }
    }
  }, []);

  // Cambiar tema
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add("dark");
        localStorage.setItem(THEME_KEY, "dark");
      } else {
        document.body.classList.remove("dark");
        localStorage.setItem(THEME_KEY, "light");
      }
      return next;
    });
  };

  // Forzar rerender cuando cambia el token
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app text-app`} key={tokenVersion}>
        <div className="flex">
          {!hideNav && (
            <>
              {/* Sidebar */}
              <aside
                className={`
                  fixed top-0 left-0 z-30 h-screen
                  ${sidebarOpen ? 'w-60' : 'w-16'}
                  bg-card border-app flex flex-col py-8 px-2 shadow-app transition-all duration-200
                  items-center
                `}
                style={{ minWidth: sidebarOpen ? 240 : 64 }}
              >
                <div className="mb-10 flex items-center justify-center w-full">
                  <HamburgerIcon open={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} />
                  {sidebarOpen && (
                    <span className="ml-3 text-xl font-bold tracking-tight text-card">Sistema de Inventario</span>
                  )}
                </div>
                <nav className="flex-1 w-full">
                  <ul className="space-y-1">
                    {filteredLinks.map(link => {
                      // Considerar /inventario/movimientos como parte de Inventario
                      const isActive =
                        (link.href === "/inventario" && (pathname === "/inventario" || pathname.startsWith("/inventario/movimientos"))) ||
                        pathname === link.href;
                      return (
                        <li key={link.href} className="relative group">
                          <Link
                            href={link.href}
                            className={`flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded-lg hover:bg-muted transition text-base font-medium text-card relative`}
                          >
                            {/* Indicador de página activa */}
                            {isActive && (
                              <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 sidebar-indicator"
                              />
                            )}
                            <span className="text-card">
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
                                <span className={`material-icons ${sidebarOpen ? 'text-lg' : 'text-base'} text-card`}>{link.icon}</span>
                              )}
                            </span>
                            {sidebarOpen && link.label}
                          </Link>
                          {!sidebarOpen && (
                            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-app text-app text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200">
                              {link.label}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                {/* Selector de tema y modo */}
                <ThemeSelector sidebarOpen={sidebarOpen} />
              </aside>
              {/* Sidebar móvil */}
              {mobileSidebar && (
                <div className="fixed inset-0 z-50 flex">
                  <aside className="w-60 bg-card border-app flex flex-col py-8 px-3 shadow-app h-full">
                    <div className="mb-10 flex items-center gap-2 px-2">
                      <HamburgerIcon open={true} onClick={() => setMobileSidebar(false)} />
                      <span className="text-xl font-bold tracking-tight text-card">Sistema de Inventario</span>
                    </div>
                    <nav className="flex-1">
                      <ul className="space-y-1">
                        {SIDEBAR_LINKS.map(link => (
                          <li key={link.href}>
                            <Link href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition text-base font-medium text-card" onClick={() => setMobileSidebar(false)}>
                              <span className="material-icons text-lg text-card">{link.icon}</span>
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    {/* Selector de tema y modo móvil */}
                    <ThemeSelector sidebarOpen={true} />
                  </aside>
                  <div className="flex-1 bg-black bg-opacity-30" onClick={() => setMobileSidebar(false)} />
                </div>
              )}
              {/* main content*/}
              <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: sidebarOpen ? 240 : 64, transition: 'margin-left 0.2s' }}>
                {/* Topbar */}
                <header
                  className="h-16 bg-card shadow-app flex items-center px-4 md:px-8 border-b border-app fixed left-0 z-40"
                  style={{
                    marginLeft: sidebarOpen ? 240 : 64,
                    width: `calc(100vw - ${sidebarOpen ? 240 : 64}px)`,
                    transition: 'margin-left 0.2s, width 0.2s'
                  }}
                >
                  {/*boton menu */}
                  <img
                    src="/sc_logo.png"
                    alt="Abrir menú"
                    className="w-8 h-8 rounded-full object-cover mr-4 md:hidden"
                    onClick={() => setMobileSidebar(true)}
                  />
                  <img
                    src="/sc_logo.png"
                    alt="Abrir/cerrar menú"
                    className="w-8 h-8 rounded-full object-cover mr-4 hidden md:block"
                  />
                  <span className="text-2xl font-bold tracking-tight text-card">Parroquia del Sagrado Corazón de Jesús</span>
                  <div className="ml-auto flex items-center">
                    {authReady && (
                      usuario ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted font-semibold">{usuario.nombre} ({usuario.rol})</span>
                          <button
                            onClick={() => {
                              if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
                                localStorage.removeItem("token");
                                window.location.href = "/auth";
                              }
                            }}
                            className="px-3 py-1 bg-muted hover:bg-muted rounded text-sm text-app font-semibold transition border border-app"
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      ) : (
                        <a
                          href="/auth"
                          className="ml-4 px-4 py-2 bg-muted hover:bg-muted text-app rounded-lg font-semibold transition border border-app"
                        >
                          Iniciar sesión
                        </a>
                      )
                    )}
                  </div>
                </header>
                {/*main content */}
                <main className="flex-1 p-8 bg-app transition-all duration-200" style={{ marginTop: 64 }}>{children}</main>
              </div>
            </>
          )}
          {hideNav && (
            <main className="flex-1">{children}</main>
          )}
        </div>
      </body>
    </html>
  );
}
