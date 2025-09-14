import BreadcrumbNav from "@/components/breadcrumb-nav"
import AcademiaCard from "@/components/academia-card"

export default function Sistemas() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav current="SISTEMAS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Sistemas</h1>

        <div className="space-y-6">
          <AcademiaCard />
        </div>
      </div>
    </div>
  )
}
