import { MUSINGS } from "@/data/musings";
import { prisma } from "@/lib/prisma";

/** Next Musing id ("m31") and number ("M.031"), after the static set and every DB row. */
export async function generateIdAndNum(): Promise<{ id: string; num: string }> {
  const musings = await prisma.musing.findMany({ select: { id: true, num: true } });
  const maxId = musings
    .map(m => parseInt(m.id.replace(/\D/g, ""), 10))
    .filter(n => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  const maxNum = musings
    .map(m => parseInt(m.num.replace(/\D/g, ""), 10))
    .filter(n => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return {
    id: `m${String(maxId + 1).padStart(2, "0")}`,
    num: `M.${String(maxNum + 1).padStart(3, "0")}`,
  };
}
