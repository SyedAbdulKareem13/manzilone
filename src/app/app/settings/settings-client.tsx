"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProfileCard } from "@/components/settings/profile-card";
import { SecurityCard } from "@/components/settings/security-card";

type SettingsUser = {
  name: string;
  email: string;
  image: string | null;
  mobile: string | null;
  role: string;
};

type ThemeOption = {
  value: string;
  label: string;
  sublabel: string;
  swatches: string[];
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: "platinum", label: "Platinum", sublabel: "Coral · default", swatches: ["#FAFAF7", "#FF5C5C", "#FF8A65", "#0F1014"] },
  { value: "sapphire", label: "Sapphire", sublabel: "Blue", swatches: ["#FAFAF7", "#5B7CFF", "#3B54E0", "#0F1014"] },
  { value: "emerald", label: "Emerald", sublabel: "Green", swatches: ["#FAFAF7", "#10B981", "#059669", "#0F1014"] },
  { value: "amber", label: "Amber", sublabel: "Gold", swatches: ["#FAFAF7", "#F59E0B", "#E08E0B", "#0F1014"] },
  { value: "violet", label: "Violet", sublabel: "Purple", swatches: ["#FAFAF7", "#8B5CF6", "#6D28D9", "#0F1014"] },
  { value: "graphite", label: "Graphite", sublabel: "Warm dark", swatches: ["#16181F", "#FF5C5C", "#E5E7EB", "#0B0C10"] },
  { value: "light", label: "Light", sublabel: "Clean & bright", swatches: ["#FFFFFF", "#111111", "#6366F1"] },
  { value: "dark", label: "Dark", sublabel: "Classic dark", swatches: ["#0B1020", "#E5E7EB", "#8B5CF6"] },
];

export function SettingsClient({ user }: { user: SettingsUser }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid gap-6">
      <ProfileCard
        user={{ name: user.name, email: user.email, image: user.image, mobile: user.mobile }}
      />

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-5 text-muted-foreground" />
            Theme &amp; accent
          </CardTitle>
          <CardDescription>
            Pick an accent — Platinum is the default. Light & dark stay classic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEME_OPTIONS.map((option) => {
              const isActive = mounted && theme === option.value;
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
                  <div className="flex items-center gap-1.5">
                    {option.swatches.map((color, i) => (
                      <span
                        key={i}
                        className="size-6 rounded-md border border-black/5 shadow-inner"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.sublabel}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <SecurityCard />
    </div>
  );
}
