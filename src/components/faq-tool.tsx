"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { BrainCircuit, Bot, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { answerFaq } from "@/ai/flows/ai-answer-faq";
import { FAQ_ENTRIES } from "@/lib/faq-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type State = {
  answer: string;
  error?: string;
};

const initialState: State = {
  answer: "",
};

async function askQuestionAction(
  prevState: State,
  formData: FormData
): Promise<State> {
  const question = formData.get("question") as string;
  if (!question || question.trim().length < 5) {
    return { answer: "", error: "Please enter a valid question." };
  }

  try {
    const result = await answerFaq({ question, faqEntries: FAQ_ENTRIES });
    return { answer: result.answer };
  } catch (e) {
    console.error(e);
    return { answer: "", error: "Sorry, I couldn't process that question. Please try again." };
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
      <Send className="mr-2 h-4 w-4" />
      {pending ? "Asking..." : "Ask Question"}
    </Button>
  );
}

export default function FaqTool() {
  const [state, formAction] = useActionState(askQuestionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.answer || state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-4">
            <Textarea
              name="question"
              placeholder="Type your question here..."
              rows={4}
              required
              minLength={5}
            />
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.answer && (
        <Alert className="border-primary">
          <div className="flex items-center space-x-3 mb-2">
            <Bot className="h-6 w-6 text-primary" />
            <AlertTitle className="font-headline text-lg text-primary">AI Assistant's Answer</AlertTitle>
          </div>
          <AlertDescription className="text-foreground text-base leading-relaxed">
            {state.answer}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
