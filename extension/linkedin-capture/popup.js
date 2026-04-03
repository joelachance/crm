const defaultCrmBaseUrl = "http://localhost:3000";

const crmBaseUrlInput = document.getElementById("crmBaseUrl");
const captureButton = document.getElementById("captureButton");
const statusElement = document.getElementById("status");

const twitterReservedSegments = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "search",
  "compose",
  "i",
  "settings",
  "login",
  "signup",
  "intent",
  "share"
]);

function setStatus(message, tone) {
  statusElement.textContent = message;
  statusElement.className = `status${tone ? ` ${tone}` : ""}`;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(["crmBaseUrl"]);
  crmBaseUrlInput.value = stored.crmBaseUrl || defaultCrmBaseUrl;
}

function detectPlatform(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.replace(/^www\./, "");
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (host === "linkedin.com" && url.pathname.startsWith("/in/")) {
      return "linkedin";
    }

    if ((host === "x.com" || host === "twitter.com") && pathParts.length >= 1 && !twitterReservedSegments.has(pathParts[0])) {
      return "twitter";
    }
  } catch {
    return null;
  }

  return null;
}

function extractProfilePayloadInPage() {
  function compactWhitespace(value) {
    return value.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  }

  function sectionText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);

      if (element && element.textContent) {
        return compactWhitespace(element.textContent);
      }
    }

    return "";
  }

  function extractLinkedInProfileText() {
    const main = document.querySelector("main");
    const topCard = sectionText([
      "main section h1",
      ".pv-text-details__left-panel h1",
      ".artdeco-entity-lockup__title"
    ]);
    const headline = sectionText([
      ".text-body-medium.break-words",
      ".pv-text-details__left-panel .text-body-medium"
    ]);
    const about = sectionText([
      "#about ~ div .display-flex.ph5.pv3 .full-width",
      "[data-generated-suggestion-target] .full-width",
      ".pv-about__summary-text"
    ]);
    const experience = sectionText([
      "#experience ~ div",
      "[id^='experience'] ~ div"
    ]);
    const education = sectionText([
      "#education ~ div",
      "[id^='education'] ~ div"
    ]);
    const rawMainText = main && main.innerText ? compactWhitespace(main.innerText) : compactWhitespace(document.body.innerText || "");

    return compactWhitespace(
      [
        `Profile URL: ${window.location.href.split("?")[0]}`,
        `Document title: ${document.title}`,
        topCard ? `Top card:\n${topCard}` : "",
        headline ? `Headline:\n${headline}` : "",
        about ? `About:\n${about}` : "",
        experience ? `Experience:\n${experience}` : "",
        education ? `Education:\n${education}` : "",
        rawMainText ? `Visible page text:\n${rawMainText}` : ""
      ]
        .filter(Boolean)
        .join("\n\n")
    ).slice(0, 18000);
  }

  function extractTwitterProfileText() {
    const main = document.querySelector("main");
    const profileHeader = sectionText([
      '[data-testid="UserName"]',
      '[data-testid="primaryColumn"] [data-testid="UserName"]'
    ]);
    const bio = sectionText([
      '[data-testid="UserDescription"]',
      '[data-testid="UserProfileHeader_Items"]'
    ]);
    const stats = sectionText([
      '[data-testid="primaryColumn"] section',
      '[data-testid="UserProfileHeader_Items"]'
    ]);
    const rawMainText = main && main.innerText ? compactWhitespace(main.innerText) : compactWhitespace(document.body.innerText || "");

    return compactWhitespace(
      [
        `Profile URL: ${window.location.href.split("?")[0]}`,
        `Document title: ${document.title}`,
        profileHeader ? `Profile header:\n${profileHeader}` : "",
        bio ? `Bio and metadata:\n${bio}` : "",
        stats ? `Profile details:\n${stats}` : "",
        rawMainText ? `Visible page text:\n${rawMainText}` : ""
      ]
        .filter(Boolean)
        .join("\n\n")
    ).slice(0, 18000);
  }

  const sourceUrl = window.location.href.split("?")[0];
  const platform = detectPlatform(sourceUrl);

  return {
    sourceUrl,
    profileText: platform === "twitter" ? extractTwitterProfileText() : extractLinkedInProfileText()
  };
}

async function getCapturePayload(activeTabId) {
  try {
    const captureResponse = await chrome.tabs.sendMessage(activeTabId, {
      type: "crm:extract-social-profile"
    });

    if (captureResponse?.ok && captureResponse.payload?.profileText) {
      return captureResponse.payload;
    }
  } catch (_error) {
    // Fall through to direct injection when no content-script receiver exists.
  }

  const injected = await chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    func: extractProfilePayloadInPage
  });

  const payload = injected[0]?.result;

  if (!payload?.profileText) {
    throw new Error("Could not read the visible profile text from this tab.");
  }

  return payload;
}

async function captureProfile() {
  captureButton.disabled = true;
  setStatus("Capturing profile and adding it to CRM...", "");

  try {
    const crmBaseUrl = normalizeBaseUrl(crmBaseUrlInput.value.trim() || defaultCrmBaseUrl);
    await chrome.storage.local.set({ crmBaseUrl });

    const activeTab = await getActiveTab();
    const platform = activeTab?.url ? detectPlatform(activeTab.url) : null;

    if (!activeTab?.id || !activeTab.url || !platform) {
      throw new Error("Open a LinkedIn or Twitter/X profile page before running capture.");
    }

    const capturePayload = await getCapturePayload(activeTab.id);

    const response = await fetch(`${crmBaseUrl}/api/linkedin-captures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(capturePayload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.redirectUrl) {
      throw new Error(data?.error || "The CRM app rejected the social profile capture.");
    }

    setStatus(`${platform === "twitter" ? "Twitter/X" : "LinkedIn"} contact added. Opening the CRM record...`, "success");
    await chrome.tabs.update(activeTab.id, { url: data.redirectUrl });
    window.close();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Profile capture failed.", "error");
  } finally {
    captureButton.disabled = false;
  }
}

captureButton.addEventListener("click", captureProfile);
void loadSettings();
