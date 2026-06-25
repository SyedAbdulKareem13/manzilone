import { prisma } from "@/lib/prisma";

export type HeroVersion = "v1" | "v2";

const SINGLETON_ID = "singleton";

/**
 * Reads the global hero version for the public landing page.
 * Falls back to "v1" if the config row is missing or the DB is unreachable,
 * so the landing never breaks on a cold/empty database.
 */
export async function getHeroVersion(): Promise<HeroVersion> {
  try {
    const cfg = await prisma.appConfig.findUnique({
      where: { id: SINGLETON_ID },
      select: { heroVersion: true },
    });
    return cfg?.heroVersion === "v2" ? "v2" : "v1";
  } catch {
    return "v1";
  }
}

/** Upserts the singleton hero version. */
export async function setHeroVersion(version: HeroVersion): Promise<HeroVersion> {
  const cfg = await prisma.appConfig.upsert({
    where: { id: SINGLETON_ID },
    update: { heroVersion: version },
    create: { id: SINGLETON_ID, heroVersion: version },
    select: { heroVersion: true },
  });
  return cfg.heroVersion === "v2" ? "v2" : "v1";
}
