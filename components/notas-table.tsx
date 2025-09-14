export default function NotasTable() {
  const asignaturas = [
    {
      id: "INF8110",
      nombre: "PROGRAMACIÓN AVANZADA",
      tipo: "OBLIGATORIO",
      nota: 6.5,
      estado: "APROBADO",
    },
    {
      id: "INF8120",
      nombre: "BASES DE DATOS",
      tipo: "OBLIGATORIO",
      nota: 5.8,
      estado: "APROBADO",
    },
    {
      id: "INF8130",
      nombre: "INGENIERÍA DE SOFTWARE",
      tipo: "OBLIGATORIO",
      nota: 6.2,
      estado: "APROBADO",
    },
    {
      id: "INF8140",
      nombre: "REDES DE COMPUTADORES",
      tipo: "OBLIGATORIO",
      nota: 5.5,
      estado: "APROBADO",
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Código</th>
            <th className="border px-4 py-2 text-left">Asignatura</th>
            <th className="border px-4 py-2 text-left">Tipo</th>
            <th className="border px-4 py-2 text-left">Nota</th>
            <th className="border px-4 py-2 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {asignaturas.map((asignatura) => (
            <tr key={asignatura.id} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{asignatura.id}</td>
              <td className="border px-4 py-2">{asignatura.nombre}</td>
              <td className="border px-4 py-2">{asignatura.tipo}</td>
              <td className="border px-4 py-2 font-medium">{asignatura.nota}</td>
              <td className="border px-4 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    asignatura.estado === "APROBADO" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {asignatura.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
