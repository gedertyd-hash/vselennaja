import { getCurrentUser } from "@/lib/dal";
import { Sidebar } from "@/components/Sidebar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar user={user} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
