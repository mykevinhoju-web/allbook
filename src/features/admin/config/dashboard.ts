import {
  CalendarDays,
  DollarSign,
  UserCircle,
  Users,
} from "lucide-react";

import type { AdminStatCardData } from "../types";

export const dashboardStats: AdminStatCardData[] = [
  {
    title: "Today's Bookings",
    value: "24",
    description: "+12% from yesterday",
    icon: CalendarDays,
  },
  {
    title: "Today's Revenue",
    value: "$3,840",
    description: "+8% from yesterday",
    icon: DollarSign,
  },
  {
    title: "Staff Count",
    value: "18",
    description: "2 on leave today",
    icon: Users,
  },
  {
    title: "Customer Count",
    value: "1,256",
    description: "+36 this week",
    icon: UserCircle,
  },
];
