import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  Heart,
  Loader2,
  LogIn,
  LogOut,
  type LucideProps,
  Menu,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type NavItem = {
  href: "/" | "/profile" | "/records";
  label: string;
  icon?: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/records", label: "Records", icon: FileText },
];

export default function Navbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/97 backdrop-blur-md border-b border-border shadow-[0_2px_12px_oklch(0.25_0.10_255_/_0.10)]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg text-navy tracking-tight">
              PulseCard
            </span>
            <span className="text-[9px] text-muted-foreground tracking-widest uppercase font-medium">
              Medical Identity
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main navigation"
        >
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "text-primary bg-medical-blue-pale"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
              {isActive(href) && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Auth Button */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Authenticated
            </div>
          )}
          <Button
            onClick={handleAuth}
            disabled={isLoggingIn}
            size="sm"
            variant={isAuthenticated ? "outline" : "default"}
            className="gap-1.5"
          >
            {isLoggingIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isAuthenticated ? (
              <LogOut className="w-3.5 h-3.5" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            {isLoggingIn
              ? "Logging in..."
              : isAuthenticated
                ? "Logout"
                : "Login"}
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-border bg-white"
          >
            <nav
              className="container mx-auto px-4 py-3 flex flex-col gap-1"
              aria-label="Mobile navigation"
            >
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "text-primary bg-medical-blue-pale"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border mt-1">
                <Button
                  onClick={() => {
                    handleAuth();
                    setMobileOpen(false);
                  }}
                  disabled={isLoggingIn}
                  className="w-full gap-2"
                  variant={isAuthenticated ? "outline" : "default"}
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isAuthenticated ? (
                    <LogOut className="w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {isLoggingIn
                    ? "Logging in..."
                    : isAuthenticated
                      ? "Logout"
                      : "Login"}
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
