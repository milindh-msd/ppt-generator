import { useRoute } from "wouter";
import { Download, ArrowLeft, Clock, FileText, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

import { useGetPresentation, getGetPresentationQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PresentationDetail() {
  const [, params] = useRoute("/presentation/:id");
  const id = params?.id || "";

  const { data: presentation, isLoading, error } = useGetPresentation(id, {
    query: {
      enabled: !!id,
      queryKey: getGetPresentationQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2 text-destructive">Error loading presentation</h2>
        <p className="text-muted-foreground mb-6">The presentation might have been deleted or doesn't exist.</p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const c = presentation.content as Record<string, unknown>;

  // Helper: render a value as a paragraph whether it's a string or legacy array
  const asParagraph = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val.join(" ");
    return "";
  };

  // Helper: get items array for advantages/disadvantages/limitations
  const asItems = (val: unknown): Array<{ heading: string; explanation: string }> => {
    if (Array.isArray(val)) return val as Array<{ heading: string; explanation: string }>;
    return [];
  };

  const introduction     = asParagraph(c.introduction);
  const explanationPart1 = asParagraph(c.explanationPart1 ?? c.mainConcept);
  const explanationPart2 = asParagraph(c.explanationPart2 ?? c.technicalExplanation);
  const conclusion       = asParagraph(c.conclusion);
  const advantages       = asItems(c.advantages);
  const disadvantages    = asItems(c.disadvantages);
  const limitations      = asItems(c.limitations);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 bg-background/80 backdrop-blur-xl z-40 py-4 border-b">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{presentation.topic}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(presentation.createdAt), 'PPpp')}</span>
            <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> Generated in {presentation.generationTimeSeconds.toFixed(1)}s</span>
          </div>
        </div>
        <Button asChild size="lg" className="shrink-0 shadow-lg shadow-primary/20">
          <a href={`/api/presentations/${presentation.id}/download`} download={`${presentation.topic}.pptx`}>
            <Download className="w-4 h-4 mr-2" />
            Download PPTX
          </a>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Slide 1 — Title */}
        <SlideCard title="1. Title Slide" variant="primary">
          <div className="text-center py-6">
            <h2 className="text-3xl font-bold">{(c.title as string) || presentation.topic}</h2>
            <p className="text-muted-foreground mt-3 text-lg">A Seminar Presentation</p>
          </div>
        </SlideCard>

        {/* Slide 2 — Introduction */}
        <SlideCard title="2. Introduction">
          <p className="text-lg text-foreground/90 leading-relaxed">{introduction}</p>
        </SlideCard>

        {/* Slide 3 — Explanation Part 1 */}
        <SlideCard title="3. Explanation">
          <p className="text-lg text-foreground/90 leading-relaxed">{explanationPart1}</p>
        </SlideCard>

        {/* Slide 4 — Explanation Part 2 */}
        <SlideCard title="4. Explanation (Continued)">
          <p className="text-lg text-foreground/90 leading-relaxed">{explanationPart2}</p>
        </SlideCard>

        {/* Slide 5 — Advantages */}
        <SlideCard title="5. Advantages" icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}>
          <div className="space-y-4">
            {advantages.map((item, i) => (
              <p key={i} className="text-foreground/90 text-base leading-relaxed">
                <span className="font-semibold text-foreground">{item.heading}: </span>
                {item.explanation}
              </p>
            ))}
          </div>
        </SlideCard>

        {/* Slide 6 — Disadvantages */}
        <SlideCard title="6. Disadvantages" icon={<AlertCircle className="w-5 h-5 text-red-500" />}>
          <div className="space-y-4">
            {disadvantages.map((item, i) => (
              <p key={i} className="text-foreground/90 text-base leading-relaxed">
                <span className="font-semibold text-foreground">{item.heading}: </span>
                {item.explanation}
              </p>
            ))}
          </div>
        </SlideCard>

        {/* Slide 7 — Limitations */}
        <SlideCard title="7. Limitations" icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}>
          <div className="space-y-4">
            {limitations.map((item, i) => (
              <p key={i} className="text-foreground/90 text-base leading-relaxed">
                <span className="font-semibold text-foreground">{item.heading}: </span>
                {item.explanation}
              </p>
            ))}
          </div>
        </SlideCard>

        {/* Slide 8 — Conclusion */}
        <SlideCard title="8. Conclusion">
          <p className="text-lg text-foreground/90 leading-relaxed">{conclusion}</p>
        </SlideCard>

        {/* Slide 9 — Thank You */}
        <SlideCard title="9. Thank You" variant="primary">
          <div className="text-center py-12">
            <h2 className="text-4xl font-bold mb-4">Thank You</h2>
            <p className="text-xl text-primary/80">Questions & Discussion</p>
          </div>
        </SlideCard>
      </div>
    </div>
  );
}

function SlideCard({
  title,
  children,
  variant = "default",
  icon,
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "primary";
  icon?: React.ReactNode;
}) {
  const variantStyles = {
    default: "bg-card border-border",
    primary: "bg-primary/5 border-primary/20",
  };

  return (
    <Card className={`overflow-hidden shadow-md ${variantStyles[variant]}`}>
      <CardHeader className="bg-muted/30 border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        {children}
      </CardContent>
    </Card>
  );
}
