"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/context/user-context";
import Image from "next/image";
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
  MessageCircle,
  MessagesSquare,
  UserPlus,
  Layers,
  Send,
} from "lucide-react";

export default function AdminSidebar() {
  const [selected, setSelected] = useState("Dashboard");
  const [openMenus, setOpenMenus] = useState({
    Users: false,
    "System Users": false,
    SMSC: false,
    Routing: false,
  });
  const { logout } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Logout successful!");
    router.push("/login");
  };

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const submenus = [
    {
      title: "Sms",
      icon: <MessageCircle className="h-5 w-5" />,
      items: [
        {
          title: "Single Sms",
          href: "/single-sms",
          icon: <MessageSquare className="h-5 w-5" />,
        },
        {
          title: "Bulk Sms",
          href: "/bulk-sms",
          icon: <MessagesSquare className="h-5 w-5" />,
        },
        {
          title: "Personalized Sms",
          href: "/personalized-sms",
          icon: <UserPlus className="h-5 w-5" />,
        },
        // {
        //   title: "Files",
        //   href: "/files",
        //   icon: <FileText className="h-5 w-5" />,
        // },
      ],
    },
  ];

  const singleItems = [
    {
      title: "SMS Report",
      href: "/sms-delivery-report",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "SMS Stats",
      href: "/sms-stats",
      icon: <Send className="h-5 w-5" />,
    },
    {
      title: "Credit History",
      href: "/credit-history",
      icon: <History className="h-5 w-5" />,
    },
    // {
    //   title: "Rate Plan",
    //   href: "/rate-plan",
    //   icon: <Layers className="h-5 w-5" />,
    // }
  ];

  return (
    <div className="h-screen w-64 bg-white border-r shadow-sm flex flex-col">
      <div className="p-4 border-b flex justify-center">
        <Image src="/AI.png" alt="AiMobile Logo" width={150} height={50} />
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-6">
          <Link
            href="/"
            className={`flex items-center px-4 py-3 rounded-lg text-gray-700 ${
              selected === "Dashboard"
                ? "bg-blue-50 text-blue-600 font-medium"
                : "hover:bg-gray-100"
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
                {openMenus[submenu.title] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {openMenus[submenu.title] && (
                <div className="mt-1 ml-4 pl-4 border-l border-gray-200">
                  {submenu.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={`flex items-center px-4 py-2 rounded-lg text-gray-700 ${
                        selected === item.title
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setSelected(item.title)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 px-3">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
            Reports
          </div>
          {singleItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center px-4 py-3 mt-1 rounded-lg text-gray-700 ${
                selected === item.title
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-gray-100"
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
  );
}
