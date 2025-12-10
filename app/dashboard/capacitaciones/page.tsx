import BreadcrumbNav from "@/components/breadcrumb-nav"
import CapacitacionesCard from "@/components/capacitaciones-card"

export default function Capacitaciones() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav current="CAPACITACIONES Y CURSOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Capacitaciones y Cursos</h1>

        <div className="space-y-6">
          <CapacitacionesCard />
        </div>
      </div>
    </div>
  )
}
