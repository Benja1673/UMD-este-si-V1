import { FileText, ArrowRight } from "lucide-react"

export default function EvaluacionesList() {
  const evaluaciones = [
    {
      id: 1,
      nombre: "Evaluación de Competencias Docentes",
      descripcion: "Evaluación para medir competencias pedagógicas",
      fecha: "01/04/2023",
      disponible: true,
    },
    {
      id: 2,
      nombre: "Evaluación de Conocimientos Técnicos",
      descripcion: "Evaluación sobre conocimientos específicos de la materia",
      fecha: "15/03/2023",
      disponible: true,
    },
    {
      id: 3,
      nombre: "Evaluación de Habilidades Digitales",
      descripcion: "Evaluación sobre uso de herramientas tecnológicas",
      fecha: "10/02/2023",
      disponible: false,
    },
    {
      id: 4,
      nombre: "Evaluación de Metodologías Activas",
      descripcion: "Evaluación sobre implementación de metodologías innovadoras",
      fecha: "05/01/2023",
      disponible: true,
    },
  ]

  return (
    <div className="space-y-4">
      {evaluaciones.map((evaluacion) => (
        <div
          key={evaluacion.id}
          className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
            !evaluacion.disponible ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium">{evaluacion.nombre}</h4>
              <p className="text-sm text-gray-500">{evaluacion.descripcion}</p>
              <p className="text-xs text-gray-400">Última actualización: {evaluacion.fecha}</p>
            </div>
          </div>
          <button
            className={`flex items-center px-4 py-2 rounded-md ${
              evaluacion.disponible
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!evaluacion.disponible}
          >
            <span className="mr-2">Realizar evaluación</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
