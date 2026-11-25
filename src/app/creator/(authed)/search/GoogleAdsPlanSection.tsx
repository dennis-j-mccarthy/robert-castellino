import { loadAdsPlan } from "@/lib/creator/ads-plan";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { hasAnthropicKey } from "@/lib/creator/ai";
import GoogleAdsPlan from "./GoogleAdsPlan";

/*
  Search → Google Ads. The plan: campaigns, ad groups, keywords, the
  responsive search ads, the landing page each group lands on, and the
  Google Ads Editor sheet that carries it into the account.
*/
export default async function GoogleAdsPlanSection() {
  const db = isDatabaseConfigured();
  const [plan, pages, targets] = await Promise.all([
    loadAdsPlan(),
    db ? prisma.landingPage.findMany({ select: { slug: true, keyword: true, title: true, published: true }, orderBy: { updatedAt: "desc" } }).catch(() => []) : Promise.resolve([]),
    db ? prisma.keyword.count({ where: { status: "target" } }).catch(() => 0) : Promise.resolve(0),
  ]);
  return <GoogleAdsPlan initial={plan} pages={pages} targets={targets} db={db} ai={hasAnthropicKey()} />;
}
