import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Calendar as CalendarIcon, History } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const today = format(new Date(), "yyyy-MM-dd");
  const isToday = selectedDate === today;

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

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
        .eq("date", selectedDate);

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
        date: selectedDate,
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {selectedDate !== today ? "Attendance History" : "Mark Attendance"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
              <History className="w-4 h-4 shrink-0" />
              {selectedDate !== today ? "View past attendance records" : "Track daily student attendance"}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="flex-1 sm:w-auto min-h-[44px]"
            />
          </div>
          {isToday && (
            <Button
              variant="accent"
              onClick={saveAttendance}
              disabled={saving}
              className="min-h-[44px] w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-success p-2 sm:p-3 rounded-lg shrink-0">
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.present}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Present Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-destructive p-2 sm:p-3 rounded-lg shrink-0">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.absent}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Absent Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 shadow-card">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-primary p-2 sm:p-3 rounded-lg shrink-0">
              <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </Card>
      </div>

      {students.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center shadow-card">
          <p className="text-muted-foreground text-base sm:text-lg">No students enrolled</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Add students first to mark attendance
          </p>
        </Card>
      ) : (
        <Card className="p-4 sm:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-semibold">
              {isToday ? "Mark Attendance" : "Attendance History"}
            </h3>
            {!isToday && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                Viewing: {format(new Date(selectedDate), "MMMM dd, yyyy")}
              </span>
            )}
          </div>
          <div className="space-y-2 sm:space-y-3">
            {students.map((student) => {
              const studentAttendance = attendance.find(
                (a) => a.student_id === student.id
              );
              const isPresent = studentAttendance?.status === "present";

              return (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg hover:bg-accent transition-smooth"
                >
                  <span className="font-medium text-sm sm:text-base">{student.name}</span>
                  {isToday ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant={isPresent ? "success" : "outline"}
                        size="sm"
                        onClick={() => toggleAttendance(student.id)}
                        className="flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1 sm:mr-2" />
                        Present
                      </Button>
                      <Button
                        variant={!isPresent ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleAttendance(student.id)}
                        className="flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm"
                      >
                        <XCircle className="w-4 h-4 mr-1 sm:mr-2" />
                        Absent
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isPresent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                          <span className="text-success font-medium text-sm sm:text-base">Present</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                          <span className="text-destructive font-medium text-sm sm:text-base">Absent</span>
                        </>
                      )}
                    </div>
                  )}
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