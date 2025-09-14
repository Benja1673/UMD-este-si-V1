"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChevronLeft, ChevronRight, Pause } from "lucide-react"
import ServiceCard from "@/components/service-card"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import CalendarioInstitucional from "@/components/calendario-institucional"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState( false)

  const banners = [
    {
      id: 1,
      title: "CONTESTA LA ENCUESTA DE PERCEPCIÓN DE SUSTENTABILIDAD EN:",
      subtitle: "¡AYÚDANOS A CONSTRUIR UNA UTEM MÁS SUSTENTABLE!",
      link: "MI.UTEM.CL",
      bgColor: "bg-gradient-to-r from-teal-600 to-blue-800",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 2,
      title: "Plan de Desarrollo Institucional",
      subtitle: "PDI 2021-2025",
      link: "Más información",
      bgColor: "bg-gradient-to-r from-orange-400 to-pink-500",
      image: "/placeholder.svg?height=300&width=300",
    },
  ]

  const services = [
    { id: 1, title: "CONSULTAS JEFE CARRERA", action: "HAZ CLIC AQUÍ", icon: "clipboard-list" },
    { id: 2, title: "MI CREDENCIAL VIRTUAL", action: "HAZ CLIC AQUÍ", icon: "id-card" },
    { id: 3, title: "MIS PAGOS", action: "HAZ CLIC AQUÍ", icon: "credit-card" },
    { id: 4, title: "MIS CERTIFICADOS", action: "HAZ CLIC AQUÍ", icon: "file-text" },
  ]

  const platforms = [
    { id: 1, name: "CANVAS", logo: "/placeholder.svg?height=50&width=50", action: "INGRESAR A LA PLATAFORMA" },
    { id: 2, name: "SIBUTEM", subtitle: "SISTEMA DE BIBLIOTECAS", logo: "/placeholder.svg?height=50&width=50", action: "INGRESAR A LA PLATAFORMA" },
    { id: 3, name: "Microsoft Teams", logo: "/placeholder.svg?height=50&width=50", action: "INGRESAR A LA PLATAFORMA" },
    { id: 4, name: "ZOOM", subtitle: "Video Communications", logo: "/placeholder.svg?height=50&width=50", action: "INGRESAR A LA PLATAFORMA" },
  ]

  // Redirige si no autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Si está cargando, no muestra nada aún
  if (status === "loading" || !session) {
    return null
  }

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isPaused, banners.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  const goToSlide = (index: number) => setCurrentSlide(index)
  const togglePause = () => setIsPaused(!isPaused)

  return (
    <div className="space-y-6">
      <BreadcrumbNav current={`Bienvenido(a), ${session.user.email} (${session.user.role})`} />

      {/* Carousel */}
      <div className="relative rounded-lg overflow-hidden">
        <div className={`relative h-64 ${banners[currentSlide].bgColor} rounded-lg overflow-hidden`}>
          <div className="absolute inset-0 flex items-center justify-between px-8 z-10">
            <button onClick={prevSlide} className="bg-white/30 rounded-full p-2 text-white hover:bg-white/50">
              <ChevronLeft size={24} />
            </button>
            <button onClick={nextSlide} className="bg-white/30 rounded-full p-2 text-white hover:bg-white/50">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex h-full">
            <div className="flex-1 flex flex-col justify-center p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">{banners[currentSlide].title}</h2>
              <p className="text-xl mb-4">{banners[currentSlide].subtitle}</p>
              {banners[currentSlide].link && (
                <button className="bg-green-600 text-white px-4 py-2 rounded-md w-fit">
                  {banners[currentSlide].link}
                </button>
              )}
            </div>
            <div className="flex-1 relative">
              <div className="absolute right-0 bottom-0 h-full w-full">
                <img
                  src={banners[currentSlide].image || "/placeholder.svg"}
                  alt="Banner illustration"
                  className="object-contain h-full"
                />
              </div>
            </div>
          </div>

          <button
            onClick={togglePause}
            className="absolute bottom-4 right-4 bg-blue-600 rounded-full p-2 text-white z-10"
          >
            <Pause size={24} />
          </button>
        </div>

        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 w-2 rounded-full ${currentSlide === index ? "bg-orange-500" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>

      {/* Service Cards */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {services.map((service) => (
            <ServiceCard key={service.id} title={service.title} action={service.action} icon={service.icon} />
          ))}
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4">
          <button className="bg-white rounded-full p-2 shadow-md">
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4">
          <button className="bg-white rounded-full p-2 shadow-md">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Noticias */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-2">
            <img src="/placeholder.svg?height=24&width=24" alt="UTEM" className="h-6" />
            <span>UTEM al día</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 h-24 rounded-lg flex items-center justify-center text-white text-xl">
          Noticias más recientes de la institución
        </div>
      </div>

      {/* Plataformas externas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-white rounded-lg p-4 shadow flex items-center gap-4">
            <img src={platform.logo || "/placeholder.svg"} alt={platform.name} className="h-12 w-12" />
            <div className="flex-1">
              <h3 className="font-bold text-blue-800">{platform.name}</h3>
              {platform.subtitle && <p className="text-sm text-gray-600">{platform.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{platform.action}</span>
              <div className="bg-gray-200 p-2 rounded">
                <img src="/placeholder.svg?height=24&width=24" alt="Enter" className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <CalendarioInstitucional />
    </div>
  )
}
