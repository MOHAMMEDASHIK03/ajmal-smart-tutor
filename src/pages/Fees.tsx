import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Send, CheckCircle } from "lucide-react";
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
  parent_name: string;
  parent_phone: string;
}

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  status: string;
  paid_date?: string;
  students: {
    name: string;
    parent_name: string;
    parent_phone: string;
  };
}

const Fees = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    amount: "",
    due_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, feesRes] = await Promise.all([
        supabase.from("students").select("id, name, parent_name, parent_phone"),
        supabase.from("fees").select("*, students(name, parent_name, parent_phone)").order("due_date", { ascending: false }),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (feesRes.error) throw feesRes.error;

      setStudents(studentsRes.data || []);
      setFees(feesRes.data || []);
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

    if (!formData.student_id || !formData.amount || !formData.due_date) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("fees").insert([
        {
          student_id: formData.student_id,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee record added successfully",
      });

      setFormData({ student_id: "", amount: "", due_date: "" });
      setOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding fee:", error);
      toast({
        title: "Error",
        description: "Failed to add fee record",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (feeId: string) => {
    try {
      const { error } = await supabase
        .from("fees")
        .update({ status: "paid", paid_date: new Date().toISOString() })
        .eq("id", feeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee marked as paid",
      });

      fetchData();
    } catch (error) {
      console.error("Error updating fee:", error);
      toast({
        title: "Error",
        description: "Failed to update fee status",
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppReminder = (fee: Fee) => {
    const englishMessage = `Dear ${fee.students.parent_name}, this is a reminder that ${fee.students.name}'s tuition fee of ₹${fee.amount} is due on ${new Date(fee.due_date).toLocaleDateString()}. Please make the payment at your earliest convenience. - Ajmal Akeel Tuition Center`;
    
    const tamilMessage = `அன்பு ${fee.students.parent_name}, ${fee.students.name} இன் பயிற்சி கட்டணம் ₹${fee.amount} ${new Date(fee.due_date).toLocaleDateString()} அன்று செலுத்த வேண்டும் என்பதை நினைவூட்டுகிறோம். தயவுசெய்து விரைவில் கட்டணத்தை செலுத்தவும். - அஜ்மல் அகீல் பயிற்சி மையம்`;

    const message = `${englishMessage}\n\n${tamilMessage}`;
    const phoneNumber = fee.students.parent_phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, "_blank");

    toast({
      title: "WhatsApp Opened",
      description: "Reminder message prepared for parent",
    });
  };

  const unpaidFees = fees.filter((f) => f.status === "not_paid");
  const paidFees = fees.filter((f) => f.status === "paid");
  
  const totalFeesAmount = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const pendingFeesAmount = unpaidFees.reduce((sum, f) => sum + Number(f.amount), 0);
  const collectedFeesAmount = paidFees.reduce((sum, f) => sum + Number(f.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading fees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Fee Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Track and manage student payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" className="gap-2 min-h-[44px] shrink-0 w-full sm:w-auto">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm sm:text-base">Add Fee Record</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Fee Record</DialogTitle>
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
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" variant="accent" className="w-full">
                Add Fee Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="p-3 sm:p-4 md:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-primary p-2 sm:p-3 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">₹{totalFeesAmount.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Fees</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-destructive p-2 sm:p-3 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">₹{pendingFeesAmount.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Pending Fees</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-success p-2 sm:p-3 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">₹{collectedFeesAmount.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Collected Fees</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 md:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="bg-accent p-2 sm:p-3 rounded-lg shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">{paidFees.length}/{fees.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Payment Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {unpaidFees.length > 0 && (
        <Card className="p-4 sm:p-6 shadow-card">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-destructive">Unpaid Fees</h3>
          <div className="space-y-3 sm:space-y-4">
            {unpaidFees.map((fee) => (
              <div
                key={fee.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base">{fee.students.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Amount: ₹{fee.amount} | Due: {new Date(fee.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendWhatsAppReminder(fee)}
                    className="gap-1 sm:gap-2 flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm"
                  >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Send Reminder</span>
                    <span className="sm:hidden">Remind</span>
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => markAsPaid(fee.id)}
                    className="flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm"
                  >
                    Mark Paid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {paidFees.length > 0 && (
        <Card className="p-4 sm:p-6 shadow-card">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-success">Paid Fees</h3>
          <div className="space-y-2 sm:space-y-3">
            {paidFees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-muted rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base truncate">{fee.students.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Amount: ₹{fee.amount} | Paid: {new Date(fee.paid_date!).toLocaleDateString()}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Fees;