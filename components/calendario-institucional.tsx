"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

export default function CalendarioInstitucional() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthNames = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ]

  const dayNames = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]

  // Eventos importantes (para destacar en azul)
  const importantDates = [10, 15, 22] // Ejemplo: días 10, 15 y 22 del mes actual

  const prevMonth = () => {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() - 1)
    setCurrentDate(date)
  }

  const nextMonth = () => {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() + 1)
    setCurrentDate(date)
  }

  // Obtener el primer día del mes (0-6, donde 0 es domingo)
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  // Ajustar para que la semana comience en lunes (0 es lunes, 6 es domingo)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // Obtener el número de días en el mes actual
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  // Obtener el número de días en el mes anterior
  const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()

  // Crear la matriz del calendario
  const calendarDays = []
  let dayCounter = 1
  let nextMonthCounter = 1

  // Días del mes anterior
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({
      day: daysInPrevMonth - startDay + i + 1,
      currentMonth: false,
      nextMonth: false,
    })
  }

  // Días del mes actual
  for (let i = 0; i < daysInMonth; i++) {
    calendarDays.push({
      day: dayCounter,
      currentMonth: true,
      nextMonth: false,
      important: importantDates.includes(dayCounter),
    })
    dayCounter++
  }

  // Días del mes siguiente (para completar la última semana)
  const remainingDays = 42 - calendarDays.length // 6 semanas * 7 días = 42
  for (let i = 0; i < remainingDays; i++) {
    calendarDays.push({
      day: nextMonthCounter,
      currentMonth: false,
      nextMonth: true,
    })
    nextMonthCounter++
  }

  // Dividir los días en semanas
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center mb-6">
        <CalendarIcon className="h-8 w-8 text-blue-500 mr-2" />
        <h2 className="text-xl font-bold text-blue-500">CALENDARIO INSTITUCIONAL</h2>
      </div>

      <div className="border border-blue-300 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full p-2">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h3 className="text-xl font-bold text-blue-600">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <button onClick={nextMonth} className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full p-2">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map((day, index) => (
            <div key={index} className={`text-xs font-medium ${index === 6 ? "text-red-500" : "text-gray-500"}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  h-8 w-full flex items-center justify-center text-sm
                  ${!day.currentMonth ? "text-gray-300" : ""}
                  ${day.currentMonth && dayIndex === 6 ? "text-red-500" : ""}
                  ${day.important ? "bg-blue-500 text-white rounded-md" : ""}
                `}
              >
                {day.day}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
