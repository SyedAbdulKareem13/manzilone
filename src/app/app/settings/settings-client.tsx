"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun, Palette, User, Mail, Shield } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

type SettingsUser = {
  name: string;
  email: string;
  role: string;
};

type ThemeOption = {
  value: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  swatches: string[];
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "platinum",
    label: "Platinum",
    sublabel: "Warm · default",
    icon: Palette,
    swatches: ["#FAFAF7", "#FF5C5C", "#FF8A65", "#0F1014"],
  },
  {
    value: "light",
    label: "Light",
    sublabel: "Clean & bright",
    icon: Sun,
    swatches: ["#FFFFFF", "#111111", "#6366F1"],
  },
  {
    value: "dark",
    label: "Dark",
    sublabel: "Low light",
    icon: Moon,
    swatches: ["#0B1020", "#E5E7EB", "#8B5CF6"],
  },
];

export function SettingsClient({ user }: { user: SettingsUser }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid gap-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-muted-foreground" />
            Profile
          </CardTitle>
          <CardDescription>Your account details across Manzil One.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-semibold tracking-tight">{user.name}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
            <Badge variant="soft" className="gap-1.5 self-start sm:self-center">
              <Shield className="size-3.5" />
              {user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-5 text-muted-foreground" />
            Theme
          </CardTitle>
          <CardDescription>Choose how Manzil One looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const isActive = mounted && theme === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive && "border-primary ring-2 ring-primary"
                  )}
                >
                  {isActive ? (
                    <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  ) : null}

                  {/* Color preview */}
                  <div className="flex items-center gap-1.5">
                    {option.swatches.map((color, i) => (
                      <span
                        key={i}
                        className="size-6 rounded-md border border-black/5 shadow-inner"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-tight">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.sublabel}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
