"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, BookOpen, GraduationCap, Layers, FileText, ChevronRight, Pin, PieChart } from "lucide-react";
import { useSession } from "next-auth/react"; // Importa useSession

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession(); // Obtén la sesión
  console.log("Session data:", session); // Imprimir la sesión en la consola
  const [isFixed, setIsFixed] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const menuItems = [
    {
      id: "inicio",
      label: "Inicio",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "datos",
      label: "Mis Datos",
      href: "/mis-datos",
      icon: <User className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "informacion",
      label: "Información Académica",
      href: "/informacion-academica",
      icon: <BookOpen className="h-5 w-5" />,
      hasSubmenu: true,
      submenu: [
        { id: "avance", label: "Avance De Malla" },
        { id: "notas", label: "Notas" },
        { id: "matricula", label: "Matrícula De Excepción" },
        { id: "horario", label: "Horario" },
        { id: "boletin", label: "Boletín De Notas" },
      ],
    },
    {
      id: "sistemas",
      label: "Sistemas",
      href: "/sistemas",
      icon: <Layers className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "capacitaciones",
      label: "Capacitaciones y cursos",
      href: "/capacitaciones",
      icon: <GraduationCap className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "gestion-docente",
      label: "Gestión Docente",
      href: "/gestion-docente",
      icon: <FileText className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "gestion-cursos",
      label: "Gestión Cursos",
      href: "/gestion-cursos",
      icon: <FileText className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "graficos-cursos",
      label: "Gráficos Cursos",
      href: "/graficos-cursos",
      icon: <PieChart className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "encuestas",
      label: "Evaluaciones",
      href: "/evaluaciones",
      icon: <FileText className="h-5 w-5" />,
      hasSubmenu: false,
    },
    {
      id: "certificados",
      label: "Certificados",
      href: "/certificados",
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

  // Filtra los items del menú según el rol
  const filteredMenuItems = menuItems.filter(item => {
    if (session?.user.role?.toUpperCase() === "DOCENTE") {
      return !["gestion-docente", "gestion-cursos", "graficos-cursos"].includes(item.id);
    }
    return true; // Mostrar todos los elementos para ADMIN y SUPERVISOR
  });

  return (
    <aside className={`bg-white border-r w-64 min-h-screen fixed left-0 top-0 z-20`}>
      <div className="flex flex-col h-full">
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center">
            <span className="ml-2 text-xl font-bold text-blue-800">UMD</span>
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
                      pathname === item.href ? "text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-100"
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

        <div className="p-4 border-t">

        </div>
      </div>
    </aside>
  );
}