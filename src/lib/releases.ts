/**
 * Release notes & roadmap — content surfaced in /app/releases and the
 * "What's new" dialog. Plain data (not user data), edited per release.
 */

export const CURRENT_VERSION = "0.5.0";

export type ChangeType = "new" | "improved" | "fixed";

export type Release = {
  version: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  summary: string;
  items: { type: ChangeType; text: string }[];
};

export const RELEASES: Release[] = [
  {
    version: "0.5.0",
    date: "2026-06-25",
    title: "Premium polish & UX fixes",
    summary: "Sharper pipeline, elegant date pickers, instant profile photo and a hardened session.",
    items: [
      { type: "improved", text: "Pipeline board now fits the viewport with internally-scrolling columns — no more overflow." },
      { type: "improved", text: "Opportunity stage control redesigned as an aligned, premium stage-rail grid." },
      { type: "new", text: "Elegant calendar date pickers across the Opportunity, RFQ and Quotation forms." },
      { type: "fixed", text: "“Add Customer” now opens a full create dialog and saves correctly." },
      { type: "improved", text: "Profile photo updates the top bar instantly after upload — no reload." },
      { type: "fixed", text: "Hardened the session cookie so large avatars can never break authentication." },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-06-25",
    title: "Production hardening",
    summary: "Complete auth flows, full Admin master-data control, notifications and PDF export.",
    items: [
      { type: "new", text: "Forgot-password sends an OTP and lets you reset; Change Password added in Settings → Security." },
      { type: "new", text: "Admin can manage all master data — user roles, territories, business units and the approval chain." },
      { type: "new", text: "Working notifications bell with fetch and mark-as-read." },
      { type: "new", text: "Export Quotations and RFQs to a branded, print-ready PDF." },
      { type: "new", text: "Profile settings: avatar upload, name and mobile." },
      { type: "new", text: "Six accent themes (Platinum default) plus a warm-dark Graphite." },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-06-24",
    title: "Opportunities & leads editing",
    summary: "Create/edit dialogs and a click-to-move stage control.",
    items: [
      { type: "fixed", text: "“Add Opportunity” now works end-to-end with a proper create dialog." },
      { type: "new", text: "Edit dialogs for Leads and Opportunities." },
      { type: "new", text: "Click-to-move pipeline stage control on the opportunity detail page." },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-06-23",
    title: "Manzil One brand & Platinum theme",
    summary: "New identity, the Platinum theme as default, and an Apple-grade performance pass.",
    items: [
      { type: "new", text: "Rebrand to Manzil One — Najm guiding-star mark, “CRM Suite” and the Urdu wordmark." },
      { type: "new", text: "Platinum theme (warm, coral) set as default; Urdu beside every section header." },
      { type: "improved", text: "Refined primary-button gradient and a performance pass for faster loads and buttery scroll." },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-21",
    title: "First cut — core CRM",
    summary: "The end-to-end revenue lifecycle, deployed.",
    items: [
      { type: "new", text: "Leads, Opportunities and a drag-and-drop Pipeline across 11 stages." },
      { type: "new", text: "RFQ, Quotation builder with the Position Determination Engine and approval workflow." },
      { type: "new", text: "Rate cards, Customers, Activities, Reports and Dashboard analytics." },
      { type: "new", text: "Authentication (email/password + OTP), multi-tenant org, deployed on Vercel + Supabase." },
    ],
  },
];

export type RoadmapStatus = "in_progress" | "planned";

export type RoadmapWeek = {
  week: string;
  range: string;
  items: { title: string; detail: string; status: RoadmapStatus }[];
};

export const ROADMAP: RoadmapWeek[] = [
  {
    week: "Week 1",
    range: "25 Jun – 1 Jul 2026",
    items: [
      { title: "Google sign-in", detail: "Enable Google OAuth for login and sign-up.", status: "in_progress" },
      { title: "Real OTP delivery", detail: "Send OTP via an email / SMS provider (currently a mock in dev).", status: "in_progress" },
      { title: "Document management", detail: "Upload, preview & version SOWs, contracts and quotations to storage.", status: "planned" },
      { title: "Global search", detail: "Search across leads, opportunities, RFQs, quotations and customers.", status: "planned" },
    ],
  },
  {
    week: "Week 2",
    range: "2 Jul – 9 Jul 2026",
    items: [
      { title: "Real-time notifications", detail: "Live push for stage changes, approvals and tasks due.", status: "planned" },
      { title: "Activity logging", detail: "Log calls, meetings and tasks with reminders and due dates.", status: "planned" },
      { title: "Reports export & filters", detail: "CSV / PDF export and date-range filters on every report.", status: "planned" },
      { title: "Quotation email-out", detail: "Send the branded quotation PDF to the customer from the app.", status: "planned" },
      { title: "AWS deployment prep", detail: "Dockerise the app and set up Jenkins CI/CD for AWS.", status: "planned" },
    ],
  },
];
