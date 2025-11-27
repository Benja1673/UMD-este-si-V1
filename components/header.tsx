"use client";

import { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

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
  const [userData, setUserData] = useState<UserData | null>(null);

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
    await signOut({ redirect: true, callbackUrl: '/login' });
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
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`${getRoleColor(userData?.role || "")} rounded-full p-3 mr-3`}>
              <User className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <div className={`${getRoleColor(userData?.role || "")} text-white px-5 py-2 rounded-md text-base font-semibold`}>
                {getRoleDisplayName(userData?.role || "")}
              </div>
              <div className="text-gray-700 text-sm font-semibold mt-1">
                {userData?.user
                  ? `${userData.user.nombre.toUpperCase()} ${userData.user.apellido.toUpperCase()}`
                  : userData?.email?.toUpperCase() || "USUARIO"}
              </div>
              {userData?.user && (
                <div className="text-gray-500 text-sm mt-0.5">
                  Nivel: {userData.user.nivelActual} | {userData.user.departamento?.codigo}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <button 
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors p-2 rounded-lg" 
            onClick={handleLogout} 
            title="Cerrar sesión"
          >
            <LogOut className="h-7 w-7" />
          </button>
        </div>
      </div>
    </header>
  );
}