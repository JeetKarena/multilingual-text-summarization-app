import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Moon, Sun } from "lucide-react";
import { Link } from "wouter";
import { Trash2, UserCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Russian", label: "Russian" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese", label: "Chinese" },
  { value: "Korean", label: "Korean" },
];

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("English");

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "text/plain": [".txt"] },
    multiple: false,
    onDrop: async (files) => {
      try {
        const file = files[0];
        const content = await file.text();
        setText(content);
      } catch (error) {
        toast({
          title: "Error reading file",
          description: "Could not read the uploaded file",
          variant: "destructive",
        });
      }
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (data: { originalText: string; language: string }) => {
      const res = await apiRequest("POST", "/api/summarize", data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to summarize text');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summaries"] });
      toast({
        title: "Success",
        description: "Text has been summarized",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: summaries, isLoading: isLoadingSummaries } = useQuery({
    queryKey: ["/api/summaries"],
  });

  const deleteSummaryMutation = useMutation({
    mutationFn: async (summaryId: number) => {
      const response = await fetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: `
            mutation DeleteSummary($id: Int!) {
              deleteSummary(id: $id)
            }
          `,
          variables: {
            id: summaryId,
          },
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      return result.data.deleteSummary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/summaries"] });
      toast({
        title: "Summary deleted",
        description: "The summary has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Text Summarizer</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Link href="/profile">
              <Button variant="outline">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Input Text</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter or paste your text here..."
                    className="min-h-[200px]"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50"
                  >
                    <input {...getInputProps()} />
                    <p>Drop a TXT file here, or click to select one</p>
                  </div>
                  <div className="flex gap-4">
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() =>
                        summarizeMutation.mutate({
                          originalText: text,
                          language,
                        })
                      }
                      disabled={!text || summarizeMutation.isPending}
                    >
                      {summarizeMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Summarize
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Summary History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSummaries ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {summaries?.map((summary) => (
                        <Card key={summary.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm text-muted-foreground">
                                {new Date(summary.createdAt).toLocaleString()} -{" "}
                                {summary.language}
                              </p>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive/90"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Summary</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this summary? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSummaryMutation.mutate(summary.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deleteSummaryMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            <p className="mb-4">{summary.summary}</p>
                            <p className="text-sm text-muted-foreground">
                              Original text: {summary.originalText.slice(0, 100)}
                              {summary.originalText.length > 100 ? "..." : ""}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}