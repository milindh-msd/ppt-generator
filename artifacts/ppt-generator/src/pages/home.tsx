import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Wand2, Clock, Trash2, ChevronRight, FileText, Activity } from "lucide-react";

import { 
  useListPresentations, 
  useGetPresentationStats,
  useGeneratePresentation,
  useDeletePresentation,
  getListPresentationsQueryKey,
  getGetPresentationStatsQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "@/components/timer";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(100, "Topic is too long"),
});

export default function Home() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: presentations, isLoading: loadingPresentations } = useListPresentations();
  const { data: stats, isLoading: loadingStats } = useGetPresentationStats();

  const generateMutation = useGeneratePresentation();
  const deleteMutation = useDeletePresentation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateMutation.mutate({ data: { topic: values.topic } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPresentationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPresentationStatsQueryKey() });
        toast({ title: "Success", description: `Generated in ${data.generationTimeSeconds} seconds` });
        setLocation(`/presentation/${data.id}`);
        form.reset();
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Generation failed", description: error.message || "An unknown error occurred" });
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPresentationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPresentationStatsQueryKey() });
        toast({ title: "Deleted", description: "Presentation has been removed" });
      }
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <section className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto mt-12 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <SparklesIcon /> AI-Powered Generation
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Turn any topic into a <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">brilliant presentation</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl">
          Enter a topic and our academic AI will structure, write, and format a comprehensive 9-slide deck in seconds.
        </p>

        <Card className="w-full glass-panel shadow-2xl overflow-hidden border-primary/20">
          <CardContent className="p-2 sm:p-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input 
                          placeholder="e.g. The impact of quantum computing on cryptography..." 
                          className="h-14 bg-transparent border-0 focus-visible:ring-0 text-lg px-4 shadow-none"
                          disabled={generateMutation.isPending}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-left px-4 pb-2" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 text-lg shrink-0 rounded-xl"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5" />
                      Generate
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="h-8 mt-4">
          <Timer isRunning={generateMutation.isPending} />
        </div>
      </section>

      {!loadingStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-panel rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <Activity className="w-5 h-5 text-muted-foreground mb-2" />
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Generated</div>
          </div>
          <div className="glass-panel rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground mb-2" />
            <div className="text-3xl font-bold text-foreground">{stats.avgGenerationSeconds.toFixed(1)}s</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Avg Time</div>
          </div>
          <div className="col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Latest Topic</div>
            <div className="text-sm font-medium text-foreground line-clamp-2">{stats.mostRecentTopic || "No presentations yet"}</div>
          </div>
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LibraryIcon /> Your Library
          </h2>
        </div>

        {loadingPresentations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : presentations?.length === 0 ? (
          <div className="text-center py-20 px-4 glass-panel rounded-2xl border-dashed">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No presentations yet</h3>
            <p className="text-muted-foreground">Generate your first presentation above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations?.map((ppt, index) => (
              <div
                key={ppt.id}
                className="group relative flex flex-col justify-between h-48 glass-panel rounded-2xl p-6 hover-elevate transition-all duration-300 hover:border-primary/50 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
              >
                {/* Clickable area for navigation */}
                <div
                  className="absolute inset-0 cursor-pointer rounded-2xl"
                  onClick={() => setLocation(`/presentation/${ppt.id}`)}
                />

                <div className="space-y-2 relative z-10 pointer-events-none">
                  <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {ppt.topic}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(ppt.createdAt), 'MMM d, yyyy')}
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    {ppt.generationTimeSeconds.toFixed(1)}s
                  </div>
                </div>

                <div className="flex items-center justify-between relative z-10 mt-4">
                  <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300 pointer-events-none">
                    View Deck <ChevronRight className="w-4 h-4" />
                  </div>

                  {/* Delete button — sits above the nav overlay */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-${ppt.id}`}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all relative z-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Presentation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this presentation and its generated PowerPoint file.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ppt.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SparklesIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
}

function LibraryIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
}