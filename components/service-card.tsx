import { ClipboardList, CreditCard, FileText, BadgeIcon as IdCard } from "lucide-react"

interface ServiceCardProps {
  title: string
  action: string
  icon: string
}

export default function ServiceCard({ title, action, icon }: ServiceCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "clipboard-list":
        return <ClipboardList className="h-6 w-6 text-white" />
      case "id-card":
        return <IdCard className="h-6 w-6 text-white" />
      case "credit-card":
        return <CreditCard className="h-6 w-6 text-white" />
      case "file-text":
        return <FileText className="h-6 w-6 text-white" />
      default:
        return <FileText className="h-6 w-6 text-white" />
    }
  }

  return (
    <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-6 min-w-[250px] flex flex-col justify-between h-32">
      <h3 className="text-white font-bold">{title}</h3>
      <div className="flex items-center justify-between mt-4">
        <span className="text-white text-sm">{action}</span>
        <div className="bg-white/20 p-2 rounded">{getIcon()}</div>
      </div>
    </div>
  )
}
