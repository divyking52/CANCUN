/**
 * Hospitality Cancún — advertising qualification form (no PHI)
 */
(function () {
  "use strict";

  const cfg = window.HC_CAMPAIGN_CONFIG || {};
  const US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
  ];
  const CA_PROVINCES = ["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function getUtm() {
    const p = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const utm = {};
    keys.forEach((k) => {
      const short = k.replace("utm_", "");
      utm[short] = p.get(k) || sessionStorage.getItem("hc_" + k) || "";
      if (p.get(k)) sessionStorage.setItem("hc_" + k, p.get(k));
    });
    return utm;
  }

  function track(eventName, payload) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: eventName, ...payload });
    } catch (_) { /* ignore */ }

    try {
      if (typeof window.gtag === "function" && cfg.tracking && cfg.tracking.ga4Id) {
        window.gtag("event", eventName, payload || {});
      }
    } catch (_) { /* ignore */ }

    try {
      if (typeof window.fbq === "function" && cfg.tracking && cfg.tracking.metaPixelId) {
        if (eventName === "lead_success") {
          window.fbq("track", "Lead", payload || {});
        } else {
          window.fbq("trackCustom", eventName, payload || {});
        }
      }
    } catch (_) { /* ignore */ }

    if (window.HC_DEBUG_TRACKING) {
      console.info("[HC tracking]", eventName, payload);
    }
  }

  function initPixels() {
    const t = cfg.tracking || {};
    if (t.ga4Id && !window.gtag) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(t.ga4Id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", t.ga4Id);
    }
    if (t.metaPixelId && !window.fbq) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", t.metaPixelId);
      window.fbq("track", "PageView");
    }
  }

  function isDemoMode() {
    return cfg.forceDemo || !cfg.webhookUrl || String(cfg.webhookUrl).trim() === "";
  }

  function buildPayload(form, submitter) {
    const fd = new FormData(form);
    const campaignId =
      fd.get("procedure") ||
      form.getAttribute("data-campaign-id") ||
      cfg.defaultCampaignId ||
      "plastic-aesthetic";

    let ctaIntent = "estimate";
    if (submitter && submitter.getAttribute && submitter.getAttribute("name") === "intentCta") {
      ctaIntent = submitter.value || "estimate";
    } else if (fd.get("intentCta")) {
      ctaIntent = String(fd.get("intentCta"));
    }

    return {
      source: "paid_campaign",
      campaignId: String(campaignId),
      landingPath: window.location.pathname + window.location.search,
      utm: getUtm(),
      contact: {
        fullName: String(fd.get("fullName") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        usState: String(fd.get("usState") || "").trim()
      },
      intent: {
        procedure: String(campaignId),
        timeline: String(fd.get("timeline") || "").trim(),
        financingRequired: String(fd.get("financingRequired") || "").trim(),
        willingToTravelMexico: String(fd.get("willingToTravelMexico") || "").trim(),
        preferredContactMethod: String(fd.get("preferredContactMethod") || "").trim(),
        preferredContactTime: String(fd.get("preferredContactTime") || "").trim()
      },
      consent: {
        communications: fd.get("consentCommunications") === "on" || fd.get("consentCommunications") === "true",
        privacy:
          fd.get("consentPrivacy") === "on" ||
          fd.get("consentPrivacy") === "true" ||
          fd.get("consentCommunications") === "on" ||
          fd.get("consentCommunications") === "true",
        timestamp: new Date().toISOString()
      },
      ctaIntent: ctaIntent,
      meta: {
        userAgent: navigator.userAgent,
        referrer: document.referrer || "",
        formStartedAt: fd.get("formStartedAt") || "",
        submittedAt: new Date().toISOString()
      }
    };
  }

  function validate(payload, form) {
    const errors = [];
    const honeypot = form.querySelector('[name="company_website"]');
    if (honeypot && honeypot.value) {
      errors.push("spam");
      return errors;
    }
    if (!payload.contact.fullName || payload.contact.fullName.length < 2) {
      errors.push("Please enter your full name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contact.email)) {
      errors.push("Please enter a valid email.");
    }
    if (!payload.contact.phone || payload.contact.phone.replace(/\D/g, "").length < 10) {
      errors.push("Please enter a phone or WhatsApp number (at least 10 digits).");
    }
    if (!payload.contact.usState) {
      errors.push("Please select your U.S. state or Canadian province.");
    }
    if (!payload.intent.timeline) {
      errors.push("Please select a preferred treatment timeline.");
    }
    if (!payload.intent.financingRequired) {
      errors.push("Please indicate whether financing is required.");
    }
    if (!payload.intent.willingToTravelMexico) {
      errors.push("Please indicate whether you can travel to Mexico.");
    }
    if (!payload.intent.preferredContactMethod) {
      errors.push("Please select a preferred contact method.");
    }
    if (!payload.intent.preferredContactTime) {
      errors.push("Please select a preferred contact time.");
    }
    if (!payload.consent.communications) {
      errors.push("Communication consent is required.");
    }
    if (!payload.consent.privacy) {
      errors.push("Please acknowledge the privacy notice.");
    }
    return errors;
  }

  function saveDemoLead(payload) {
    const key = cfg.demoStorageKey || "hc_campaign_leads_demo";
    const max = cfg.demoMaxLeads || 50;
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(list)) list = [];
    } catch (_) {
      list = [];
    }
    list.unshift(payload);
    localStorage.setItem(key, JSON.stringify(list.slice(0, max)));
    console.info("[HC demo lead]", payload);
  }

  async function submitLead(payload) {
    if (isDemoMode()) {
      saveDemoLead(payload);
      return { ok: true, mode: "demo" };
    }
    const res = await fetch(cfg.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Submit failed (" + res.status + ")");
    }
    return { ok: true, mode: "webhook" };
  }

  function showErrors(el, messages) {
    if (!el) return;
    if (!messages.length) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.innerHTML = messages.map((m) => "<li>" + m + "</li>").join("");
  }

  function fillStateSelect(select) {
    if (!select || select.options.length > 1) return;
    const usGroup = document.createElement("optgroup");
    usGroup.label = "United States";
    US_STATES.forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      usGroup.appendChild(opt);
    });
    select.appendChild(usGroup);
    const caGroup = document.createElement("optgroup");
    caGroup.label = "Canada";
    CA_PROVINCES.forEach((code) => {
      const opt = document.createElement("option");
      opt.value = "CA-" + code;
      opt.textContent = code;
      caGroup.appendChild(opt);
    });
    select.appendChild(caGroup);
  }

  function thankYouUrl(payload) {
    const base = cfg.thankYouPath || "lp/thank-you.html";
    const u = new URL(base, window.location.origin + "/");
    u.searchParams.set("campaign", payload.campaignId);
    return u.href;
  }

  function bindToggleGroups(form) {
    form.querySelectorAll("[data-toggle-group]").forEach((group) => {
      const name = group.getAttribute("data-toggle-group");
      const hidden = form.querySelector('input[name="' + name + '"]');
      group.querySelectorAll("button[data-value]").forEach((btn) => {
        btn.addEventListener("click", function () {
          group.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          if (hidden) hidden.value = btn.getAttribute("data-value") || "";
        });
      });
    });
  }

  function bindForm(form) {
    if (!form || form.dataset.hcBound === "1") return;
    form.dataset.hcBound = "1";

    fillStateSelect(form.querySelector('[name="usState"]'));
    bindToggleGroups(form);

    const started = form.querySelector('[name="formStartedAt"]');
    if (started && !started.value) started.value = new Date().toISOString();

    const procedure = form.querySelector('[name="procedure"]');
    const campaignId = form.getAttribute("data-campaign-id") || cfg.defaultCampaignId;
    if (procedure && !procedure.value) procedure.value = campaignId;

    const errorBox = form.querySelector("[data-form-errors]");
    const submitButtons = form.querySelectorAll('[type="submit"]');

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const payload = buildPayload(form, e.submitter);
      const errors = validate(payload, form);
      if (errors.includes("spam")) {
        window.location.href = thankYouUrl(payload);
        return;
      }
      if (errors.length) {
        showErrors(errorBox, errors);
        track("lead_validation_error", { campaignId: payload.campaignId });
        return;
      }
      showErrors(errorBox, []);
      submitButtons.forEach((btn) => {
        btn.disabled = true;
      });
      const primary = form.querySelector(".btn-dark") || submitButtons[0];
      if (primary) {
        primary.dataset.label = primary.textContent;
        primary.textContent = "Sending…";
      }
      track("lead_submit", { campaignId: payload.campaignId, ctaIntent: payload.ctaIntent });
      try {
        const result = await submitLead(payload);
        track("lead_success", {
          campaignId: payload.campaignId,
          mode: result.mode,
          ctaIntent: payload.ctaIntent
        });
        window.location.href = thankYouUrl(payload);
      } catch (err) {
        showErrors(errorBox, [
          "We could not send your request. Please try again in a moment."
        ]);
        track("lead_error", { campaignId: payload.campaignId });
        submitButtons.forEach((btn) => {
          btn.disabled = false;
        });
        if (primary) {
          primary.textContent = primary.dataset.label || "Request a Confidential Cost Estimate";
        }
      }
    });
  }

  function init() {
    initPixels();
    getUtm();
    document.querySelectorAll("[data-qualify-form]").forEach(bindForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.HCQualify = {
    getUtm: getUtm,
    isDemoMode: isDemoMode,
    buildPayload: buildPayload,
    US_STATES: US_STATES
  };
})();
