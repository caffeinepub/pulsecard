import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, LogIn } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { identity, login, loginStatus, isInitializing, clear } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message === "User is already authenticated") {
        await clear();
        queryClient.clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy mb-2">
            Secure Access Required
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            This section contains private medical data. Please login with
            Internet Identity to continue.
          </p>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gap-2 w-full"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggingIn ? "Connecting..." : "Login to Access"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
