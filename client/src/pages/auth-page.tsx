import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Loader2, Moon, Sun } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({
        username: true,
        password: true,
      })
    ),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  return (
    <div className="min-h-screen flex bg-background transition-colors duration-300">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Text Summarizer</CardTitle>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="login">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Form {...loginForm}>
                        <form
                          onSubmit={loginForm.handleSubmit((data) =>
                            loginMutation.mutate(data)
                          )}
                        >
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="login-username">Username</Label>
                              <Input
                                id="login-username"
                                {...loginForm.register("username")}
                              />
                            </div>
                            <div>
                              <Label htmlFor="login-password">Password</Label>
                              <Input
                                id="login-password"
                                type="password"
                                {...loginForm.register("password")}
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={loginMutation.isPending}
                            >
                              {loginMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Login
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="register">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Form {...registerForm}>
                        <form
                          onSubmit={registerForm.handleSubmit((data) =>
                            registerMutation.mutate(data)
                          )}
                        >
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="register-firstName">
                                  First Name
                                </Label>
                                <Input
                                  id="register-firstName"
                                  {...registerForm.register("firstName")}
                                />
                              </div>
                              <div>
                                <Label htmlFor="register-lastName">
                                  Last Name
                                </Label>
                                <Input
                                  id="register-lastName"
                                  {...registerForm.register("lastName")}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="register-email">Email</Label>
                              <Input
                                id="register-email"
                                type="email"
                                {...registerForm.register("email")}
                              />
                            </div>
                            <div>
                              <Label htmlFor="register-username">Username</Label>
                              <Input
                                id="register-username"
                                {...registerForm.register("username")}
                              />
                            </div>
                            <div>
                              <Label htmlFor="register-password">Password</Label>
                              <Input
                                id="register-password"
                                type="password"
                                {...registerForm.register("password")}
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={registerMutation.isPending}
                            >
                              {registerMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Register
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <div className="hidden lg:flex flex-1 bg-muted items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-lg"
        >
          <h1 className="text-4xl font-bold mb-4">
            AI-Powered Text Summarization
          </h1>
          <p className="text-lg text-muted-foreground">
            Transform long texts into concise summaries using advanced AI
            technology. Support for multiple languages and file uploads. Get
            started by creating an account or logging in.
          </p>
        </motion.div>
      </div>
    </div>
  );
}