import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    unpaidFees: 0,
    totalRemarks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [studentsRes, attendanceRes, feesRes, remarksRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "present"),
        supabase.from("fees").select("id", { count: "exact", head: true }).eq("status", "not_paid"),
        supabase.from("remarks").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        presentToday: attendanceRes.count || 0,
        unpaidFees: feesRes.count || 0,
        totalRemarks: remarksRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: "Total Students",
      value: stats.totalStudents,
      color: "bg-primary",
    },
    {
      icon: Calendar,
      label: "Present Today",
      value: stats.presentToday,
      color: "bg-success",
    },
    {
      icon: DollarSign,
      label: "Unpaid Fees",
      value: stats.unpaidFees,
      color: "bg-destructive",
    },
    {
      icon: AlertCircle,
      label: "Total Remarks",
      value: stats.totalRemarks,
      color: "bg-accent",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Overview of your tuition center</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="p-3 sm:p-4 md:p-6 shadow-card hover:shadow-elegant transition-smooth"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 sm:p-6 shadow-card">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <a
            href="/students"
            className="p-3 sm:p-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-smooth text-center min-h-[88px] flex flex-col items-center justify-center"
          >
            <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
            <p className="font-medium text-sm sm:text-base">Manage Students</p>
          </a>
          <a
            href="/attendance"
            className="p-3 sm:p-4 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-smooth text-center min-h-[88px] flex flex-col items-center justify-center"
          >
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
            <p className="font-medium text-sm sm:text-base">Mark Attendance</p>
          </a>
          <a
            href="/fees"
            className="p-3 sm:p-4 bg-gradient-accent text-accent-foreground rounded-lg hover:opacity-90 transition-smooth text-center min-h-[88px] flex flex-col items-center justify-center"
          >
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
            <p className="font-medium text-sm sm:text-base">Track Fees</p>
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;