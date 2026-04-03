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

function isLinkedInProfilePage() {
  return window.location.hostname.includes("linkedin.com") && window.location.pathname.startsWith("/in/");
}

function isTwitterProfilePage() {
  const host = window.location.hostname.replace(/^www\./, "");
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const reserved = new Set([
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

  return (host === "x.com" || host === "twitter.com") && pathParts.length >= 1 && !reserved.has(pathParts[0]);
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
  const title = document.title;
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
      `Document title: ${title}`,
      profileHeader ? `Profile header:\n${profileHeader}` : "",
      bio ? `Bio and metadata:\n${bio}` : "",
      stats ? `Profile details:\n${stats}` : "",
      rawMainText ? `Visible page text:\n${rawMainText}` : ""
    ]
      .filter(Boolean)
      .join("\n\n")
  ).slice(0, 18000);
}

function extractProfileText() {
  if (isLinkedInProfilePage()) {
    return extractLinkedInProfileText();
  }

  if (isTwitterProfilePage()) {
    return extractTwitterProfileText();
  }

  return compactWhitespace(document.body.innerText || "").slice(0, 18000);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "crm:extract-social-profile") {
    return;
  }

  sendResponse({
    ok: true,
    payload: {
      sourceUrl: window.location.href.split("?")[0],
      profileText: extractProfileText()
    }
  });
});
