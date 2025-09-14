export default function HorarioTable() {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
  const horas = ["08:00 - 09:30", "09:40 - 11:10", "11:20 - 12:50", "14:00 - 15:30", "15:40 - 17:10", "17:20 - 18:50"]

  const clases = [
    { dia: "Lunes", hora: "08:00 - 09:30", asignatura: "PROGRAMACIÓN AVANZADA", sala: "Lab 301" },
    { dia: "Lunes", hora: "09:40 - 11:10", asignatura: "BASES DE DATOS", sala: "Sala 205" },
    { dia: "Martes", hora: "11:20 - 12:50", asignatura: "INGENIERÍA DE SOFTWARE", sala: "Sala 304" },
    { dia: "Miércoles", hora: "14:00 - 15:30", asignatura: "REDES DE COMPUTADORES", sala: "Lab 302" },
    { dia: "Jueves", hora: "15:40 - 17:10", asignatura: "PROGRAMACIÓN AVANZADA", sala: "Lab 301" },
    { dia: "Viernes", hora: "08:00 - 09:30", asignatura: "BASES DE DATOS", sala: "Sala 205" },
  ]

  const getClase = (dia: string, hora: string) => {
    return clases.find((clase) => clase.dia === dia && clase.hora === hora)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Hora</th>
            {dias.map((dia) => (
              <th key={dia} className="border px-4 py-2 text-left">
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horas.map((hora) => (
            <tr key={hora} className="hover:bg-gray-50">
              <td className="border px-4 py-2 font-medium">{hora}</td>
              {dias.map((dia) => {
                const clase = getClase(dia, hora)
                return (
                  <td key={`${dia}-${hora}`} className="border px-4 py-2">
                    {clase ? (
                      <div className="bg-blue-100 p-2 rounded">
                        <div className="font-medium text-blue-800">{clase.asignatura}</div>
                        <div className="text-xs text-blue-600">{clase.sala}</div>
                      </div>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
