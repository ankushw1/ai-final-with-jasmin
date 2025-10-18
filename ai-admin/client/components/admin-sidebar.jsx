"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"
import Image from "next/image"
import {
  Home,
  Users,
  Shield,
  UserCheck,
  User,
  DollarSign,
  Phone,
  MessageSquare,
  Wifi,
  History,
  List,
  BarChart,
  FileText,
  LogOut,
  ChevronRight,
  ChevronDown,
  Filter,
  Shuffle,
  Globe,
  Flag,
  ArrowUpRight,
  Settings,
  Bell,
} from "lucide-react"

export default function AdminSidebar() {
  const [selected, setSelected] = useState("Dashboard")
  const [openMenus, setOpenMenus] = useState({
    Users: false,
    "System Users": false,
    SMSC: false,
    Routing: false,
  })
  const { logout } = useUser()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    toast.success("Logout successful!") 
    router.push("/")
  }

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }))
  }

  const submenus = [
        {
      title: "System Users",
      icon: <User className="h-5 w-5" />,
      items: [
        { title: "Admin", href: "/admin/manage-admin", icon: <Shield className="h-5 w-5" /> },
        // { title: "Support", href: "/admin/manage-support", icon: <User className="h-5 w-5" /> },
        // { title: "Sales", href: "/admin/manage-sales", icon: <DollarSign className="h-5 w-5" /> },
      ],
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      items: [
        { title: "Customer", href: "/admin/manage-customer", icon: <UserCheck className="h-5 w-5" /> },
        { title: "SMS Users", href: "/admin/manage-sms-users", icon: <User className="h-5 w-5" /> },
      ],
    },
    {
      title: "SMSC",
      icon: <Phone className="h-5 w-5" />,
      items: [
        { title: "SMPP Carrier", href: "/admin/manage-smpp", icon: <MessageSquare className="h-5 w-5" /> },
        { title: "SMS Groups", href: "/admin/manage-sms-groups", icon: <Users className="h-5 w-5" /> },
      ],
    },
    {
      title: "Routing",
      icon: <Wifi className="h-5 w-5" />,
      items: [
        { title: "Routing", href: "/admin/manage-routing", icon: <Shuffle className="h-5 w-5" /> },
        { title: "Rates", href: "/admin/manage-rates", icon: <DollarSign className="h-5 w-5" /> },
        { title: "Country", href: "/admin/manage-country", icon: <Globe className="h-5 w-5" /> },
        { title: "Operator", href: "/admin/manage-operator", icon: <Phone className="h-5 w-5" /> },
        { title: "Prefix", href: "/admin/manage-prefix", icon: <Flag className="h-5 w-5" /> },
      ],
    },
  {
  title: "Finance",
  icon: <DollarSign className="h-5 w-5" />,
  items: [
    { title: "User Balance", href: "/admin/user-balance", icon: <BarChart className="h-5 w-5" /> },
    { title: "Manage Credit", href: "/admin/manage-credit", icon: <ArrowUpRight className="h-5 w-5" /> },
  ],
},
// {
//   title: "Finance Charts",
//   icon: <DollarSign className="h-5 w-5" />,
//   items: [
//     { title: "Daily User Balance", icon: <BarChart className="h-5 w-5" /> },
//     { title: "Daily Customer Consumption", href: "/admin/sms-report", icon: <BarChart className="h-5 w-5" /> },
//     { title: "Daily Sent Stats by Amount & Country", icon: <BarChart className="h-5 w-5" /> },
//     { title: "Monthly Customer Credit", icon: <DollarSign className="h-5 w-5" /> },
//     { title: "Customer Invoices", icon: <FileText className="h-5 w-5" /> },
//     { title: "SMSC Invoices", icon: <FileText className="h-5 w-5" /> },
//     { title: "Existing Overdraft (Prepaid Users)", icon: <FileText className="h-5 w-5" /> },
//     { title: "Monthly SMSC Consumption", icon: <BarChart className="h-5 w-5" /> },
//     { title: "Daily SMSC Sent Data", icon: <BarChart className="h-5 w-5" /> },
//     { title: "Daily Customer Profit", icon: <DollarSign className="h-5 w-5" /> },
//     { title: "Netting Summary (Daily & Monthly)", icon: <List className="h-5 w-5" /> },
//   ],
// },
// {
//   title: "Statistics Charts",
//   icon: <BarChart className="h-5 w-5" />,
//   items: [
//     { title: "User Statistics", icon: <User className="h-5 w-5" /> },
//     { title: "Reseller Statistics (Daily & Monthly)", icon: <Users className="h-5 w-5" /> },
//     { title: "Gateway Statistics (Daily & Monthly)", icon: <Wifi className="h-5 w-5" /> },
//     { title: "Top Destinations (Daily & Monthly)", icon: <Globe className="h-5 w-5" /> },
//   ],
// },
// {
//   title: "SMSC Status",
//   icon: <Phone className="h-5 w-5" />,
//   items: [
//     { title: "SMSC Route Status", icon: <Shuffle className="h-5 w-5" /> },
//     { title: "SMPP Client Bind Status (Port 4001)", icon: <Wifi className="h-5 w-5" /> },
//     { title: "SMPP Client Bind Status (Port 5001)", icon: <Wifi className="h-5 w-5" /> },
//     { title: "SMPP Client Bind Status (Port 6001)", icon: <Wifi className="h-5 w-5" /> },
//     { title: "SMPP Client Bind Status (Port 7001)", icon: <Wifi className="h-5 w-5" /> },
//   ],
// },
// {
//   title: "Rates",
//   icon: <DollarSign className="h-5 w-5" />,
//   items: [
//     { title: "SMSC Rates", icon: <Phone className="h-5 w-5" /> },
//     { title: "SMPP Carrier Rates", icon: <MessageSquare className="h-5 w-5" /> },
//     { title: "SMPP Client Rates", icon: <User className="h-5 w-5" /> },
//   ],
// },
// {
//   title: "Routing",
//   icon: <Shuffle className="h-5 w-5" />,
//   items: [
//     { title: "Customer Routing", icon: <Users className="h-5 w-5" /> },
//     { title: "SMSC Rate Mapping", icon: <DollarSign className="h-5 w-5" /> },
//     { title: "Default Loose Route Routing", icon: <Shuffle className="h-5 w-5" /> },
//     { title: "Clone User to User", icon: <User className="h-5 w-5" /> },
//     { title: "Clone Route to User with %", icon: <ArrowUpRight className="h-5 w-5" /> },
//     { title: "Country List", icon: <Globe className="h-5 w-5" /> },
//     { title: "Operator List", icon: <Phone className="h-5 w-5" /> },
//     { title: "Prefix List", icon: <Flag className="h-5 w-5" /> },
//   ],
// },
// {
//   title: "UI Jobs",
//   icon: <Users className="h-5 w-5" />,
//   items: [
//     { title: "Bulk Job", icon: <List className="h-5 w-5" /> },
//     { title: "Personalized Job", icon: <UserCheck className="h-5 w-5" /> },
//   ],
// },
// {
//   title: "Utilities",
//   icon: <Settings className="h-5 w-5" />,
//   items: [
//     { title: "Test SMS", icon: <MessageSquare className="h-5 w-5" /> },
//     { title: "Page Access Rules (Role-wise)", icon: <Shield className="h-5 w-5" /> },
//     { title: "Whitelisted IP Rules", icon: <Globe className="h-5 w-5" /> },
//     { title: "Spam Rules (Blocked Words & Sender ID)", icon: <Filter className="h-5 w-5" /> },
//     { title: "Sender Rules (Incoming/Outgoing)", icon: <ArrowUpRight className="h-5 w-5" /> },
//     { title: "Bulk Notifications (Email)", icon: <Bell className="h-5 w-5" /> },
//     { title: "Set Templates (Incoming SMS)", icon: <FileText className="h-5 w-5" /> },
//   ],
// }



  ]

  const singleItems = [
    { title: "SMS Report", href: "/admin/sms-report", icon: <FileText className="h-5 w-5" /> },
    // { title: "Billing Report", href: "/admin/billing-report", icon: <FileText className="h-5 w-5" /> },
    // { title: "Overall Report", href: "/admin/overall-report", icon: <BarChart className="h-5 w-5" /> },
    { title: "Login History", href: "/admin/login-history", icon: <History className="h-5 w-5" /> },
  ]

  return (
    <div className="h-screen w-64 bg-white border-r shadow-sm flex flex-col">
      <div className="p-4 border-b flex justify-center">
        <Image src="/AI.png" alt="AiMobile Logo" width={150} height={50} />
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-6">
          <Link
            href="/admin"
            className={`flex items-center px-4 py-3 rounded-lg text-gray-700 ${selected === "Dashboard" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            onClick={() => setSelected("Dashboard")}
          >
            <Home className="h-5 w-5 mr-3" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="space-y-1 px-3">
          {submenus.map((submenu) => (
            <div key={submenu.title} className="mb-2">
              <button
                onClick={() => toggleMenu(submenu.title)}
                className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center">
                  {submenu.icon}
                  <span className="ml-3 font-medium">{submenu.title}</span>
                </div>
                {openMenus[submenu.title] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {openMenus[submenu.title] && (
                <div className="mt-1 ml-4 pl-4 border-l border-gray-200">
                  {submenu.items.map((item) => (
                    item.href ? (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={`flex items-center px-4 py-2 rounded-lg text-gray-700 ${selected === item.title ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
                          }`}
                        onClick={() => setSelected(item.title)}
                      >
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </Link>
                    ) : (
                      <div
                        key={item.title}
                        className={`flex items-center px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed`}
                      >
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </div>
                    )
                  ))}

                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 px-3">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Reports</div>
          {singleItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center px-4 py-3 mt-1 rounded-lg text-gray-700 ${selected === item.title ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
                }`}
              onClick={() => setSelected(item.title)}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
