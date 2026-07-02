import { StaffForm } from "@/features/staff";

interface EditStaffPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { id } = await params;

  return <StaffForm staffId={id} />;
}
