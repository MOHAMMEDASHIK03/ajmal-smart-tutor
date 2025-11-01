import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, DollarSign, MessageSquare, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: Calendar, label: "Attendance", path: "/attendance" },
    { icon: DollarSign, label: "Fees", path: "/fees" },
    { icon: MessageSquare, label: "Remarks", path: "/remarks" },
    { icon: HelpCircle, label: "AI Help", path: "/ai-help" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Ajmal Akeel Tuition Center</h1>
          <p className="text-sm opacity-90">Student Management System</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-elegant"
                      : "bg-card hover:bg-accent text-card-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;