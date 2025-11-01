import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent";
}

const Attendance = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0 });
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    setStats({ present, absent });
  }, [attendance]);

  const fetchData = async () => {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name")
        .order("name");

      if (studentsError) throw studentsError;

      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("date", today);

      setStudents(studentsData || []);
      
      const attendanceMap = new Map(
        (attendanceData || []).map((a) => [a.student_id, a.status as "present" | "absent"])
      );

      setAttendance(
        (studentsData || []).map((student) => ({
          student_id: student.id,
          status: attendanceMap.get(student.id) || "absent",
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.student_id === studentId
          ? { ...a, status: a.status === "present" ? "absent" : "present" }
          : a
      )
    );
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = attendance.map((a) => ({
        student_id: a.student_id,
        date: today,
        status: a.status,
      }));

      const { error } = await supabase.from("attendance").upsert(records, {
        onConflict: "student_id,date",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Attendance</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {format(new Date(), "MMMM dd, yyyy")}
          </p>
        </div>
        <Button
          variant="accent"
          onClick={saveAttendance}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="bg-success p-3 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.present}</p>
              <p className="text-sm text-muted-foreground">Present Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="bg-destructive p-3 rounded-lg">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.absent}</p>
              <p className="text-sm text-muted-foreground">Absent Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-lg">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </Card>
      </div>

      {students.length === 0 ? (
        <Card className="p-12 text-center shadow-card">
          <p className="text-muted-foreground text-lg">No students enrolled</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add students first to mark attendance
          </p>
        </Card>
      ) : (
        <Card className="p-6 shadow-card">
          <h3 className="text-xl font-semibold mb-4">Mark Attendance</h3>
          <div className="space-y-3">
            {students.map((student) => {
              const studentAttendance = attendance.find(
                (a) => a.student_id === student.id
              );
              const isPresent = studentAttendance?.status === "present";

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-smooth"
                >
                  <span className="font-medium">{student.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant={isPresent ? "success" : "outline"}
                      size="sm"
                      onClick={() => toggleAttendance(student.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Present
                    </Button>
                    <Button
                      variant={!isPresent ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleAttendance(student.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Absent
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Attendance;