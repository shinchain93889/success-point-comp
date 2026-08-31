import FaqTool from "@/components/faq-tool";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function FaqPage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">AI-Powered FAQ</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-primary-foreground/80">
            Have a question? Ask our AI assistant for an instant answer based on our frequently asked questions.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="mb-8 bg-secondary/50 border-accent">
            <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                    <Lightbulb className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-headline text-lg font-semibold">How to use this tool</h3>
                        <p className="text-muted-foreground">Simply type your question about our services, courses, or pricing into the box below. Our AI will analyze your query and provide an answer based on our compiled list of common questions. For example, try asking "What programming courses do you offer?" or "Do you fix broken laptop screens?".</p>
                    </div>
                </div>
            </CardContent>
          </Card>
          <FaqTool />
        </div>
      </section>
    </>
  );
}
