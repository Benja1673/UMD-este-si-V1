"use client";

import { JSX, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, User, GraduationCap, Layers, FileText, ChevronRight, PieChart, Settings } from "lucide-react";
import { useSession } from "next-auth/react";


export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  type SubmenuItem = { id: string; label: string };
  type MenuItem = {
    id: string;
    label: string;
    href: string;
    icon: JSX.Element;
    hasSubmenu: boolean;
    submenu?: SubmenuItem[];
  };

  // ✅ CORRECCIÓN: Agregamos "/dashboard" al inicio de todas las rutas
  const menuItems: MenuItem[] = [
    {
      id: "inicio",
      label: "Inicio",
      href: "/dashboard", // Esta ya estaba bien
      icon: <Home className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "datos",
      label: "Mis Datos",
      href: "/dashboard/mis-datos", // Antes: "/mis-datos"
      icon: <User className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "sistemas",
      label: "Sistemas",
      href: "/dashboard/sistemas", // Antes: "/sistemas"
      icon: <Layers className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "capacitaciones",
      label: "Capacitaciones y cursos",
      href: "/dashboard/capacitaciones", // Antes: "/capacitaciones"
      icon: <GraduationCap className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "gestion-docente",
      label: "Gestión Docente",
      href: "/dashboard/gestion-docente", // Antes: "/gestion-docente"
      icon: <FileText className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "gestion-cursos",
      label: "Gestión Cursos",
      href: "/dashboard/gestion-cursos", // Antes: "/gestion-cursos"
      icon: <FileText className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "gestion-servicios",
      label: "Gestión Servicios",
      href: "/dashboard/gestion-servicios", // Antes: "/gestion-servicios"
      icon: <Settings className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "graficos-cursos",
      label: "Gráficos Cursos",
      href: "/dashboard/graficos-cursos", // Antes: "/graficos-cursos"
      icon: <PieChart className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "encuestas",
      label: "Evaluaciones",
      href: "/dashboard/evaluaciones", // Antes: "/evaluaciones"
      icon: <FileText className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "certificados",
      label: "Certificados",
      href: "/dashboard/certificados", // Antes: "/certificados"
      icon: <FileText className="h-5 w-5" />,
      hasSubmenu: false,
    },
  ];

  const toggleSubmenu = (id: string) => {
    if (expandedMenu === id) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(id);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (session?.user.role?.toUpperCase() === "DOCENTE") {
      return !["gestion-docente", "gestion-cursos", "gestion-servicios", "graficos-cursos"].includes(item.id);
    }
    return true;
  });

  return (
    <aside className={`bg-white border-r w-64 min-h-screen fixed left-0 top-0 z-20`}>
      <div className="flex flex-col h-full">
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center">
            
            {/* Ajuste de Tamaño:
               - h-14 (56px) en vez de h-10 (40px)
               - w-12 (48px) en vez de w-8 (32px)
               - Ajusta estos números hasta que te guste
            */}
            <div className="relative h-14 w-12 mr-2"> 
              <Image 
                src="/Logoutem-1.png" 
                alt="Logo UTEM"
                fill
                className="object-contain" // Mantiene la proporción original
                priority
              />
            </div>
            
            <span className="text-xl font-bold text-blue-800">UMD</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <div className="relative">
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm rounded-md group ${
                      // Mejoramos la lógica para que el item quede activo si estás dentro de una subsección
                      pathname.startsWith(item.href) ? "text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={(e) => {
                      if (item.hasSubmenu) {
                        e.preventDefault();
                        toggleSubmenu(item.id);
                      }
                    }}
                  >
                    <span className="mr-3 text-blue-500">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.hasSubmenu && (
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${expandedMenu === item.id ? "rotate-90" : ""}`}
                      />
                    )}
                  </Link>
                </div>

                {item.hasSubmenu && expandedMenu === item.id && (
                  <ul className="mt-1 pl-10 space-y-1">
                    {item.submenu?.map((subItem) => (
                      <li key={subItem.id} className="py-1">
                        <div className="flex items-center">
                          <span className="h-1 w-1 bg-gray-400 rounded-full mr-2"></span>
                          <Link
                            href={`${item.href}?tab=${subItem.id}`}
                            className="text-sm text-gray-700 hover:text-blue-600"
                          >
                            {subItem.label}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t"></div>
      </div>
    </aside>
  );
}