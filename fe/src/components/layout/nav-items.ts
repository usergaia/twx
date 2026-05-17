import {
  BarChart,
  Bot,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  Mail,
  Map,
  MessageSquare,
  Package,
  Route,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  ready: boolean;
  week?: number;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    ready: true,
  },
  { label: "Email Test", href: "/email-test", icon: Mail, ready: true },
  {
    label: "Driver Evaluation",
    href: "/drivers/evaluate",
    icon: Gauge,
    ready: true,
  },
  {
    label: "Batch Evaluation",
    href: "/drivers/batch",
    icon: FileSpreadsheet,
    ready: true,
  },
  { label: "Drivers", href: "/drivers", icon: Users, ready: false, week: 5 },
  { label: "Orders", href: "/orders", icon: Package, ready: false, week: 5 },
  { label: "Maps", href: "/maps", icon: Map, ready: false, week: 6 },
  { label: "Routes", href: "/routes", icon: Route, ready: false, week: 7 },
  { label: "Agents", href: "/agents", icon: Bot, ready: false, week: 10 },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart,
    ready: false,
    week: 11,
  },
  { label: "Chat", href: "/chat", icon: MessageSquare, ready: false, week: 12 },
];
