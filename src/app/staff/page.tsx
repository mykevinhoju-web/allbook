import { StaffHome } from "@/features/staff-portal";
import { Suspense } from "react";

export default function StaffHomePage() {
  return (
    <Suspense>
      <StaffHome />
    </Suspense>
  );
}
