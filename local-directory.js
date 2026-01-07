
// local-directory.js
// Load and render a local business directory from companies.json
// Assumes a <div data-local-directory> element on the page with optional data attributes:
// data-site-key, data-max-companies, data-exclude-industries, data-description-variant

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
    hash = hash & 0xffffffff;
  }
  return Math.abs(hash);
}

async function initLocalDirectory() {
  const containers = document.querySelectorAll("[data-local-directory]");
  if (!containers.length) return;

  // TODO: Replace this URL with the actual URL where you host companies.json
  const DATA_URL = "https://github.com/Zainshk64/SqaureSpace/companies.json";

  let companies;
  try {
    const res = await fetch(DATA_URL, { cache: "no-cache" });
    companies = await res.json();
  } catch (e) {
    console.error("Error loading companies.json", e);
    return;
  }

  containers.forEach(container => {
    try {
      renderDirectory(container, companies);
    } catch (e) {

      
      console.error("Error rendering directory", e);
    }
  });
}

function renderDirectory(container, companies) {
  const siteKey = container.dataset.siteKey || window.location.hostname;
  const maxCompanies = parseInt(container.dataset.maxCompanies || "25", 10);
  const excludeIndustries = (container.dataset.excludeIndustries || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const descVariantIndex = parseInt(container.dataset.descriptionVariant || "0", 10);

  // Filter by industries if needed
  let filtered = companies.filter(c => {
    const inds = Array.isArray(c.industries) ? c.industries : [];
    if (excludeIndustries.length && inds.some(ind => excludeIndustries.map(i => i.toLowerCase()).includes(ind.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Try to find host company by matching domain
  const hostDomain = siteKey.replace(/^www\./i, "").toLowerCase();
  let hostCompany = filtered.find(c => {
    const domain = (c.primaryDomain || "").replace(/^www\./i, "").toLowerCase();
    return domain && domain === hostDomain;
  }) || null;

  // Remove host from others to avoid duplication
  let others = hostCompany
    ? filtered.filter(c => c !== hostCompany)
    : filtered.slice();

  // Stable, per-site ordering using hash
  others.sort((a, b) => {
    const ha = hashString(siteKey + "::" + a.id);
    const hb = hashString(siteKey + "::" + b.id);
    return ha - hb;
  });

  const limit = hostCompany ? maxCompanies - 1 : maxCompanies;
  const selectedOthers = others.slice(0, Math.max(0, limit));
  const selected = hostCompany ? [hostCompany, ...selectedOthers] : selectedOthers;

  // Build HTML list
  let html = '<div class="local-directory-list">';
  selected.forEach(c => {
    const variants = Array.isArray(c.descriptionVariants) ? c.descriptionVariants : [];
    const desc =
      variants[descVariantIndex] ||
      variants[0] ||
      "";

    html += `
      <article class="local-directory-item">
        <h3 class="local-directory-name">
          <a href="${c.url}" rel="noopener noreferrer">
            ${c.name}
          </a>
        </h3>
        <p class="local-directory-description">
          ${desc}
        </p>
      </article>
    `;
  });
  html += "</div>";

  container.innerHTML = html;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLocalDirectory);
} else {
  initLocalDirectory();
}
