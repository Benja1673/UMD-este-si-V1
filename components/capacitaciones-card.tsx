import { Button } from "@/components/ui/button"
import { BookOpen, Users } from "lucide-react"

export default function CapacitacionesCard() {
  return (
    <div className="bg-gray-100 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Capacitaciones Disponibles</h3>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-md">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium">Capacitación STEM</h4>
              <p className="text-sm text-gray-500">Ciencia, Tecnología, Ingeniería y Matemáticas</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm">
              Curso de capacitación para docentes en metodologías STEM y su aplicación en el aula.
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>25 cupos disponibles</span>
              <span className="mx-2">•</span>
              <span>40 horas</span>
              <span className="mx-2">•</span>
              <span>Inicia: 15/05/2023</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">Acceder</Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-md">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium">Capacitación Inclusividad en Aula</h4>
              <p className="text-sm text-gray-500">Estrategias para una educación inclusiva</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm">
              Curso orientado a desarrollar competencias para la inclusión educativa y atención a la diversidad en el
              aula.
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>15 cupos disponibles</span>
              <span className="mx-2">•</span>
              <span>30 horas</span>
              <span className="mx-2">•</span>
              <span>Inicia: 01/06/2023</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button className="bg-green-600 hover:bg-green-700">Acceder</Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-md">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h4 className="font-medium">Herramientas Digitales para la Docencia</h4>
              <p className="text-sm text-gray-500">Tecnologías aplicadas a la educación</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm">
              Aprende a utilizar herramientas digitales para mejorar la experiencia de aprendizaje de tus estudiantes.
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>20 cupos disponibles</span>
              <span className="mx-2">•</span>
              <span>25 horas</span>
              <span className="mx-2">•</span>
              <span>Inicia: 10/07/2023</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button className="bg-purple-600 hover:bg-purple-700">Acceder</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
