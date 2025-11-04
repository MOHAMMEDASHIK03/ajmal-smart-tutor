import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  id: string;
  name: string;
}

interface Remark {
  id: string;
  student_id: string;
  remark: string;
  created_at: string;
  students: {
    name: string;
  };
}

const Remarks = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    remark: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, remarksRes] = await Promise.all([
        supabase.from("students").select("id, name").order("name"),
        supabase
          .from("remarks")
          .select("*, students(name)")
          .order("created_at", { ascending: false }),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (remarksRes.error) throw remarksRes.error;

      setStudents(studentsRes.data || []);
      setRemarks(remarksRes.data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.remark.trim()) {
      toast({
        title: "Error",
        description: "Please select a student and enter a remark",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("remarks").insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Remark added successfully",
      });

      setFormData({ student_id: "", remark: "" });
      setOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding remark:", error);
      toast({
        title: "Error",
        description: "Failed to add remark",
        variant: "destructive",
      });
    }
  };

  const getStudentRemarkCount = (studentId: string) => {
    return remarks.filter((r) => r.student_id === studentId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading remarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Student Remarks</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Track student behavior and homework completion</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" className="gap-2 min-h-[44px] shrink-0 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span className="text-sm sm:text-base">Add Remark</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student Remark</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="student">Student</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, student_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="remark">Remark</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData({ ...formData, remark: e.target.value })
                  }
                  placeholder="e.g., Did not complete homework"
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" variant="accent" className="w-full">
                Add Remark
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-semibold mb-4">Students with Frequent Remarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {students
            .map((student) => ({
              ...student,
              remarkCount: getStudentRemarkCount(student.id),
            }))
            .filter((s) => s.remarkCount > 0)
            .sort((a, b) => b.remarkCount - a.remarkCount)
            .slice(0, 6)
            .map((student) => (
              <div
                key={student.id}
                className="p-4 bg-muted rounded-lg flex items-center justify-between"
              >
                <span className="font-medium">{student.name}</span>
                <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-semibold">
                  {student.remarkCount}
                </span>
              </div>
            ))}
        </div>
        {students.filter((s) => getStudentRemarkCount(s.id) > 0).length === 0 && (
          <p className="text-center text-muted-foreground">No remarks recorded yet</p>
        )}
      </Card>

      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-semibold mb-4">All Remarks</h3>
        {remarks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No remarks added yet</p>
        ) : (
          <div className="space-y-4">
            {remarks.map((remark) => (
              <div
                key={remark.id}
                className="p-4 bg-muted rounded-lg border-l-4 border-primary"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{remark.students.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(remark.created_at).toLocaleDateString()} at{" "}
                    {new Date(remark.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground pl-6">{remark.remark}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Remarks;