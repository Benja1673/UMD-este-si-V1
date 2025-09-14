"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Mail, Cake, Sun, Moon, Eye, Menu, LogOut, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { signOut } from "next-auth/react"; // Importa signOut

interface UserData {
  id: string;
  email: string;
  role: string;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string;
    especialidad: string;
    estado: string;
    nivelActual: string;
    departamento?: {
      id: string;
      nombre: string;
      codigo: string;
    };
  };
}

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userDataFromStorage = sessionStorage.getItem("users");
    if (userDataFromStorage) {
      setUserData(JSON.parse(userDataFromStorage));
    } else {
      const cookies = document.cookie.split(";");
      const userDataCookie = cookies.find((cookie) => cookie.trim().startsWith("userData="));
      if (userDataCookie) {
        try {
          const cookieValue = decodeURIComponent(userDataCookie.split("=")[1]);
          setUserData(JSON.parse(cookieValue));
        } catch (error) {
          console.error("Error parsing user data from cookie:", error);
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' }); // Redirige a la página de login
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "ADMINISTRADOR";
      case "SUPERVISOR":
        return "SUPERVISOR";
      case "DOCENTE":
        return "DOCENTE";
      case "INSTRUCTOR":
        return "INSTRUCTOR";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500";
      case "SUPERVISOR":
        return "bg-purple-500";
      case "DOCENTE":
        return "bg-blue-500";
      case "INSTRUCTOR":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-4">

          <div className="flex items-center">

            <span className="mx-4 text-gray-300">|</span>
            <div className="flex items-center">
              <div className={`${getRoleColor(userData?.role || "")} rounded-full p-2 mr-2`}>
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className={`${getRoleColor(userData?.role || "")} text-white px-4 py-1 rounded-md text-sm`}>
                  {getRoleDisplayName(userData?.role || "")}
                </div>
                <div className="text-gray-600 text-xs font-medium">
                  {userData?.user
                    ? `${userData.user.nombre.toUpperCase()} ${userData.user.apellido.toUpperCase()}`
                    : userData?.email?.toUpperCase() || "USUARIO"}
                </div>
                {userData?.user && (
                  <div className="text-gray-500 text-xs">
                    Nivel: {userData.user.nivelActual} | {userData.user.departamento?.codigo}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="flex items-center text-blue-500 hover:text-blue-600">
            <Mail className="h-5 w-5" />
            <span className="ml-1 text-sm">Mi Correo</span>
          </button>

          <button className="text-blue-500 hover:text-blue-600">
            <Cake className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-1">
            <Sun className="h-4 w-4 text-gray-500" />
            <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
            <Moon className="h-4 w-4 text-gray-500" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-blue-500 hover:text-blue-600 relative">
                <Eye className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2 text-sm font-medium">Notificaciones</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Nuevo curso disponible</DropdownMenuItem>
              <DropdownMenuItem>Evaluación pendiente</DropdownMenuItem>
              <DropdownMenuItem>Certificado listo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-blue-500 hover:text-blue-600">
                <Bell className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2 text-sm font-medium">Alertas</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>No hay alertas nuevas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center text-gray-600 hover:text-gray-800">
                <div className="bg-orange-100 border border-orange-200 rounded-md px-2 py-1 flex items-center">
                  <span className="text-sm mr-1">Mi Perfil</span>
                  <span className="bg-gray-200 rounded-full p-1">
                    <User className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push("/mis-datos")}>Mi perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Ayuda</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="text-blue-500 hover:text-blue-600">
            <Menu className="h-5 w-5" />
          </button>

          <button className="text-blue-500 hover:text-blue-600" onClick={handleLogout} title="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}