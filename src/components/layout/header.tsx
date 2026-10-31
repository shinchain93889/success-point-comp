"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Users,
  Award,
  FileSpreadsheet,
  History,
  User,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Logo from "@/components/icons/logo";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentPortalUser } from "@/lib/supabase/mock-data";
import { signOutUser } from "@/lib/supabase/auth-service";
import { UserProfile } from "@/lib/types/portal";

const publicNavLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/verify", label: "Verify Certificate" },
  { href: "/login", label: "Portal Login" },
  { href: "/faq", label: "AI FAQ" },
];

const adminNavLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Student Records", icon: Users },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/upload", label: "Upload & Import", icon: FileSpreadsheet },
  { href: "/admin/settings/audit-logs", label: "Audit Logs", icon: History },
];

const studentNavLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/certificate", label: "My Certificate", icon: Award },
  { href: "/student/profile", label: "Profile Settings", icon: User },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const isAdminPortal = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isStudentPortal = pathname.startsWith("/student") && pathname !== "/student/login";
  const isPortalMode = isAdminPortal || isStudentPortal;

  useEffect(() => {
    if (isPortalMode) {
      setUser(getCurrentPortalUser());
    }
  }, [pathname, isPortalMode]);

  const handleLogout = async () => {
    await signOutUser();
    setIsMobileMenuOpen(false);
    setUser(null);
    window.location.href = "/";
  };

  const portalLinks = isAdminPortal ? adminNavLinks : studentNavLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xs">
      <div className="container flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Institute Logo & Optional Portal Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={isAdminPortal ? "/admin/dashboard" : isStudentPortal ? "/student/dashboard" : "/"}
            className="flex items-center overflow-visible"
          >
            <Logo className="h-7 w-auto" />
          </Link>

          {isPortalMode && (
            <span
              className={cn(
                "hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                isAdminPortal
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/30"
              )}
            >
              {isAdminPortal ? "ADMIN PORTAL" : "STUDENT PORTAL"}
            </span>
          )}
        </div>

        {/* Center: Navigation Links */}
        {isPortalMode ? (
          <nav className="hidden lg:flex items-center space-x-1">
            {portalLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                    isActive
                      ? "bg-amber-500/15 text-amber-500 font-bold"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {publicNavLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === href ? "text-primary font-semibold" : "text-foreground/60"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Actions: Theme Toggle, User/Logout or Get a Quote */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <ThemeToggle />

          {isPortalMode ? (
            <>
              {user && (
                <span className="hidden xl:inline-block text-xs font-semibold text-foreground/80 max-w-[140px] truncate">
                  {user.full_name}
                </span>
              )}

              <Link
                href="/"
                target="_blank"
                className="hidden xl:inline-flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground px-2 py-1 transition-colors"
                title="View Website in new tab"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-8 px-2.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <Button
              asChild
              className="hidden md:inline-flex bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Link href="/contact">Get a Quote</Link>
            </Button>
          )}

          {/* Mobile Sheet Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={isPortalMode ? "lg:hidden h-9 w-9" : "md:hidden h-9 w-9"}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col h-full">
                <div className="mb-6 flex items-center justify-between pr-6">
                  <Link
                    href={isAdminPortal ? "/admin/dashboard" : isStudentPortal ? "/student/dashboard" : "/"}
                    className="flex items-center overflow-visible"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Logo className="h-7 w-auto" />
                  </Link>
                  <ThemeToggle />
                </div>

                {isPortalMode && user && (
                  <div className="mb-4 p-3 bg-accent/30 rounded-xl border border-accent/40">
                    <p className="text-xs font-bold text-foreground">{user.full_name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {isAdminPortal ? "Administrator" : "Student"}
                    </p>
                  </div>
                )}

                <nav className="flex flex-col space-y-2">
                  {isPortalMode
                    ? portalLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors",
                              isActive
                                ? "bg-amber-500/15 text-amber-500"
                                : "text-foreground/80 hover:bg-accent"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })
                    : publicNavLinks.map(({ href, label }) => (
                        <Link
                          key={label}
                          href={href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "px-3 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-accent",
                            pathname === href ? "text-primary font-bold" : "text-foreground/80"
                          )}
                        >
                          {label}
                        </Link>
                      ))}
                </nav>

                <div className="mt-auto pt-4 flex flex-col gap-2">
                  {isPortalMode ? (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full text-xs font-semibold justify-center gap-1.5"
                      >
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Public Website</span>
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full text-xs font-semibold justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                        Get a Quote
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
