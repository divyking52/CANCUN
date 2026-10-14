/**
 * Hospitality Cancún — campaign runtime config
 * Set webhookUrl and pixel IDs before paid traffic. Empty webhook = demo mode.
 */
window.HC_CAMPAIGN_CONFIG = {
  /** POST JSON leads here (Zapier / Make / n8n / CRM). Empty string enables demo mode. */
  webhookUrl: "",

  /** Force demo even if webhookUrl is set (local testing). */
  forceDemo: false,

  /** Thank-you redirect (from site root) */
  thankYouPath: "lp/thank-you.html",

  /** Privacy page path (from site root) */
  privacyPath: "lp/privacy.html",

  /** Default campaign when form does not override */
  defaultCampaignId: "plastic-aesthetic",

  tracking: {
    /** Google Analytics 4 measurement ID, e.g. G-XXXXXXXX */
    ga4Id: "",
    /** Meta Pixel ID */
    metaPixelId: "",
    /** Optional GTM container */
    gtmId: ""
  },

  /** localStorage key for demo lead audit trail */
  demoStorageKey: "hc_campaign_leads_demo",

  /** Max demo leads retained in localStorage */
  demoMaxLeads: 50
};
