import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbNavProps {
  current: string
  parent?: {
    label: string
    href: string
  }
}

export default function BreadcrumbNav({ current, parent }: BreadcrumbNavProps) {
  return (
    <div className="flex items-center text-sm text-gray-500 mb-4">
      {/* Cambio de "/" a "/dashboard" para ir al panel principal */}
      <Link href="/dashboard" className="flex items-center hover:text-blue-600">
        <span>INICIO</span>
      </Link>

      {parent && (
        <>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={parent.href} className="flex items-center hover:text-blue-600">
            <span>{parent.label}</span>
          </Link>
        </>
      )}

      <ChevronRight className="h-4 w-4 mx-2" />
      <span className="text-orange-500 font-medium uppercase">{current}</span>
    </div>
  )
}