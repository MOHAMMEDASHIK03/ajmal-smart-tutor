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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your tuition center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="p-6 shadow-card hover:shadow-elegant transition-smooth"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/students"
            className="p-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-smooth text-center"
          >
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Manage Students</p>
          </a>
          <a
            href="/attendance"
            className="p-4 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-smooth text-center"
          >
            <Calendar className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Mark Attendance</p>
          </a>
          <a
            href="/fees"
            className="p-4 bg-gradient-accent text-accent-foreground rounded-lg hover:opacity-90 transition-smooth text-center"
          >
            <DollarSign className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Track Fees</p>
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;