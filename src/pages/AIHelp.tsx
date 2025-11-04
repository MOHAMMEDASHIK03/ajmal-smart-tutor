import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AIHelp = () => {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor-help", {
        body: { question },
      });

      if (error) throw error;

      setAnswer(data.answer);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-primary rounded-full mb-3 sm:mb-4">
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">AI Tutor Assistant</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Get help with teaching questions and student management</p>
      </div>

      <Card className="p-4 sm:p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
              Ask your question
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., How can I explain algebra concepts to beginners?"
              rows={4}
              className="resize-none text-sm sm:text-base"
            />
          </div>
          <Button
            type="submit"
            variant="accent"
            className="w-full gap-2 min-h-[44px] text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Getting Answer...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Get AI Answer
              </>
            )}
          </Button>
        </form>
      </Card>

      {answer && (
        <Card className="p-4 sm:p-6 shadow-card bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-start gap-2 sm:gap-3 mb-3">
            <div className="p-2 bg-primary rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">AI Answer</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap">{answer}</p>
          </div>
        </Card>
      )}

      <Card className="p-4 sm:p-6 shadow-card bg-muted/50">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">Example Questions</h3>
        <div className="space-y-2">
          {[
            "What are effective ways to motivate students who don't complete homework?",
            "How should I communicate with parents about their child's progress?",
            "What teaching strategies work best for mixed-ability classrooms?",
            "How can I make math more engaging for students?",
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setQuestion(example)}
              className="w-full text-left p-2.5 sm:p-3 bg-background rounded-lg hover:bg-accent transition-smooth text-xs sm:text-sm min-h-[44px] flex items-center"
            >
              {example}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AIHelp;