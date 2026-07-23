import { getCurrentUser } from "@/lib/dal";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar user={user} />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNav user={user} />
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
      </div>
    </div>
  );
}
