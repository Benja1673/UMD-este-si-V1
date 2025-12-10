import BreadcrumbNav from "@/components/breadcrumb-nav"
import EvaluacionesList from "@/components/evaluaciones-list"

export default function Evaluaciones() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav current="EVALUACIONES" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Evaluaciones</h1>

        <EvaluacionesList />
      </div>
    </div>
  )
}
