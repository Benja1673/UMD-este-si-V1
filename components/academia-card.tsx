export default function AcademiaCard() {
  return (
    <div className="bg-gray-100 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Academia</h3>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-md">
              <img src="/placeholder.svg?height=32&width=32" alt="Academia" className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium">Sistema de Academia</h4>
              <p className="text-sm text-gray-500">Gestión académica y administrativa</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm">Accede al sistema de gestión académica para profesores y administrativos.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Acceder</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-md">
              <img src="/placeholder.svg?height=32&width=32" alt="Reportes" className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium">Sistema de Reportes</h4>
              <p className="text-sm text-gray-500">Informes y estadísticas</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm">Genera reportes y visualiza estadísticas sobre el rendimiento académico.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Acceder</button>
          </div>
        </div>
      </div>
    </div>
  )
}
