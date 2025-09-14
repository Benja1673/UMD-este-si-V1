import { FileText, Download } from "lucide-react"

export default function CertificadosList() {
  const certificados = [
    {
      id: 1,
      nombre: "Certificado de Alumno Regular",
      descripcion: "Documento que acredita la condición de alumno regular",
      fecha: "01/04/2023",
      disponible: true,
    },
    {
      id: 2,
      nombre: "Certificado de Notas",
      descripcion: "Documento que detalla las calificaciones obtenidas",
      fecha: "15/03/2023",
      disponible: true,
    },
    {
      id: 3,
      nombre: "Certificado de Título en Trámite",
      descripcion: "Documento que acredita que el título está en proceso",
      fecha: "10/02/2023",
      disponible: false,
    },
    {
      id: 4,
      nombre: "Certificado de Ranking",
      descripcion: "Documento que indica la posición en el ranking de la carrera",
      fecha: "05/01/2023",
      disponible: true,
    },
  ]

  return (
    <div className="space-y-4">
      {certificados.map((certificado) => (
        <div
          key={certificado.id}
          className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
            !certificado.disponible ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium">{certificado.nombre}</h4>
              <p className="text-sm text-gray-500">{certificado.descripcion}</p>
              <p className="text-xs text-gray-400">Última actualización: {certificado.fecha}</p>
            </div>
          </div>
          <button
            className={`flex items-center px-4 py-2 rounded-md ${
              certificado.disponible
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!certificado.disponible}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </button>
        </div>
      ))}
    </div>
  )
}
