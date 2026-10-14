# Hospitality Cancún — advertising lead workflow

This document covers **advertising CRM** handling only. Clinical records, photos, diagnoses, and eligibility decisions live in a separate secure medical workflow.

## Goal

Generate qualified inquiries from uninsured, underinsured, or self-pay U.S. patients seeking planned treatment in Mexico — starting with **dental implants** (`/lp/dental-implants.html`).

## Intake path

1. Patient completes the campaign qualification form (no PHI).
2. `js/qualify.js` builds a JSON payload with campaign id, UTMs, contact, intent, and consent timestamps.
3. Payload POSTs to `HC_CAMPAIGN_CONFIG.webhookUrl` (Zapier / Make / n8n / CRM).  
   If `webhookUrl` is empty, **demo mode** stores the lead in browser `localStorage` under `hc_campaign_leads_demo`.
4. Tracking events: `lead_submit`, `lead_success` (and GA4/Meta when IDs are set).

## Coordinator checklist (immediate)

| Step | Action | Owner |
|------|--------|--------|
| 1 | Ingest lead + campaign source into approved lead-management system | Automation / CRM |
| 2 | Notify assigned patient coordinator immediately | CRM alert / SMS / email |
| 3 | Confirm receipt to patient; explain next step | Coordinator |
| 4 | Schedule consultation | Coordinator |
| 5 | If eligible to proceed, move patient into **secure medical-review** process | Coordinator + clinical ops |
| 6 | Keep advertising CRM free of unnecessary medical detail | All |

## CRM status model (non-clinical)

Use these stages in the advertising CRM:

| Status | Meaning |
|--------|---------|
| `new` | Lead just arrived |
| `contacted` | Coordinator reached out |
| `consult_scheduled` | Consultation booked |
| `quoted` | Non-clinical package quote shared (details may live in clinical system) |
| `financing` | Financing inquiry in progress |
| `deposit` | Deposit received (ops flag only) |
| `scheduled` | Procedure date reserved (ops flag) |
| `completed` | Journey completed from ops view |
| `disqualified` | Not a fit — use reason **code** only |
| `lost` | Soft decline / no response — use reason **code** only |

### Non-conversion / ineligibility reason codes (no PHI)

- `not_willing_to_travel`
- `timeline_too_far`
- `budget_financing_decline`
- `wrong_procedure_interest`
- `unresponsive`
- `spam_invalid_contact`
- `duplicate`
- `clinical_handoff_elsewhere` (moved fully to clinical system; no detail)
- `other_ops` (free text ops note **without** medical content)

Never store diagnoses, medications, imaging, or record summaries in the advertising CRM.

## Payload fields (reference)

See form output from `js/qualify.js`:

- `source`, `campaignId`, `landingPath`, `utm`
- `contact`: fullName, email, phone, usState
- `intent`: procedure, timeline, financingRequired, willingToTravelMexico, preferredContactMethod, preferredContactTime
- `consent`: communications, privacy, timestamp
- `meta`: userAgent, referrer, formStartedAt, submittedAt

## Pre-launch compliance checklist

Before paid traffic:

- [ ] Confirm the procedure may be advertised on selected platforms (Meta, Google, etc.)
- [ ] Legal/medical review of all claims (quality, savings, safety, outcomes)
- [ ] Remove or replace placeholder U.S. cost comparison until client-approved numbers exist (`data/procedures/dental-implants.json` → `usComparison`)
- [ ] No guarantees, exaggerated results, or unverified medical claims on the LP or ads
- [ ] Written permission for every testimonial, photograph, and any before/after (this campaign avoids before/after)
- [ ] Confirm secure process for medical records and sensitive patient information (outside this form)
- [ ] Review privacy, consent, healthcare, and advertising requirements with counsel
- [ ] Keep advertising qualification separate from clinical eligibility decisions
- [ ] Ensure a qualified medical/dental professional makes all treatment decisions
- [ ] Set `webhookUrl`, GA4, and Meta Pixel IDs in `js/campaign-config.js`
- [ ] Test thank-you redirect and lead notification to the on-call coordinator
- [ ] Mobile QA on the landing page and form

## Adding the next procedure campaign

1. Copy `data/procedures/dental-implants.json` → `data/procedures/<slug>.json` with approved content.
2. Copy `lp/dental-implants.html` → `lp/<slug>.html` and update copy, price, and `data-campaign-id`.
3. Point ads to the new path only (one procedure per campaign).
4. Do not merge multiple procedures onto one generic paid LP.
