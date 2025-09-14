import BreadcrumbNav from "@/components/breadcrumb-nav"
import CertificadosList from "@/components/certificados-list"

export default function Certificados() {
  return (
    <div className="space-y-6">
      <BreadcrumbNav current="CERTIFICADOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Certificados</h1>

        <CertificadosList />
      </div>
    </div>
  )
}
