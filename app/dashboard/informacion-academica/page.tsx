"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import NotasTable from "@/components/notas-table"
import HorarioTable from "@/components/horario-table"

export default function InformacionAcademica() {
  const [activeTab, setActiveTab] = useState("notas")

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="INFORMACIÓN ACADÉMICA" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Información Académica</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="notas">Notas</TabsTrigger>
            <TabsTrigger value="horario">Horario</TabsTrigger>
            <TabsTrigger value="avance">Avance De Malla</TabsTrigger>
            <TabsTrigger value="matricula">Matrícula De Excepción</TabsTrigger>
            <TabsTrigger value="boletin">Boletín De Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="notas">
            <NotasTable />
          </TabsContent>

          <TabsContent value="horario">
            <HorarioTable />
          </TabsContent>

          <TabsContent value="avance">
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-4">Avance De Malla</h3>
              <p>Contenido del avance de malla académica.</p>
            </div>
          </TabsContent>

          <TabsContent value="matricula">
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-4">Matrícula De Excepción</h3>
              <p>Contenido de matrícula de excepción.</p>
            </div>
          </TabsContent>

          <TabsContent value="boletin">
            <div className="p-4 border rounded-md">
              <h3 className="text-lg font-medium mb-4">Boletín De Notas</h3>
              <p>Contenido del boletín de notas.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
