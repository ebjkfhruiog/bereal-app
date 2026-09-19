import { useAuth } from '../store/AuthContext';

/**
 * Reusable ad placement for the free tier.
 *
 * AD PROVIDER INTEGRATION POINT
 * ------------------------------
 * This renders a labeled dev placeholder so the layout can be built and
 * tested without real ad credentials. To connect a real network (e.g.
 * Google AdSense/AdMob, or a mobile mediation SDK once this ships as a
 * native/PWA shell):
 *   1. Add the provider's script/SDK init once at the app root.
 *   2. Swap the placeholder <div> below for the provider's ad unit
 *      component, keyed by `slot`.
 *   3. Keep the `if (user?.isPremium) return null` guard — Stubby+ users
 *      must never see ads, anywhere.
 *
 * Placement rule (product requirement): never render <AdSlot /> on the
 * study timer screen, inside the schedule grid, or anywhere it could
 * block/delay starting a study session. Only place it in passive spots
 * (end of a list, dashboard footer, stats page).
 */
export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  const { user } = useAuth();
  if (user?.isPremium) return null;

  return (
    <div
      data-ad-slot={slot}
      className={`rounded-2xl border border-dashed border-ink-200 bg-ink-50 px-4 py-3 text-center ${className ?? ''}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Advertisement</p>
      <p className="text-xs text-ink-400 mt-0.5">Stubby+ removes all ads — dev placeholder ({slot})</p>
    </div>
  );
}
