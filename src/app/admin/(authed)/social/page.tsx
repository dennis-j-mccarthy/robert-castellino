import { isMetaConfigured } from "@/lib/meta/config";
import { getConnection, isConnected } from "@/lib/meta/store";
import SocialClient from "./SocialClient";

export const dynamic = "force-dynamic";

// The Social tool: connect Bob's Facebook once, then publish/schedule
// posts to his Page straight from here — no browser automation.
export default async function AdminSocialPage() {
  const configured = isMetaConfigured();
  const conn = await getConnection();

  return (
    <section className="admin-page">
      <h1>Social</h1>
      <p>
        Publish and schedule posts to Bob&rsquo;s Facebook Page directly from
        the site. Connect once; the app does the rest through Meta&rsquo;s API.
      </p>
      <SocialClient
        configured={configured}
        connected={isConnected(conn)}
        page={conn?.pageName ?? null}
        instagram={conn?.igUsername ?? null}
        fbUser={conn?.fbUserName ?? null}
        tokenExpiresAt={conn?.tokenExpiresAt ? conn.tokenExpiresAt.toISOString() : null}
      />
    </section>
  );
}
