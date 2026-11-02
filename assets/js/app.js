"use strict";

// Website ini hanya pratinjau. Semua data contoh ditulis langsung di HTML.
// JavaScript hanya membuka popup, navigasi, dan menyaring tampilan sementara.
const rootUrl = new URL("../../", document.currentScript.src);
const modalRoot = document.getElementById("modal-root");
const isCustomer = document.body.classList.contains("customer");
let previousFocus;
let toastTimer;

function showNotice(
  message = "Ini hanya pratinjau. Data tidak diubah atau disimpan.",
) {
  const notice = document.getElementById("toast");
  notice.textContent = message;
  notice.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => notice.classList.remove("show"), 3200);
}

function closePreview() {
  modalRoot.replaceChildren();
  document.body.classList.remove("modal-open");
  previousFocus?.focus();
}

function openPreview(templateId) {
  const template = document.getElementById(templateId);
  if (!template) {
    showNotice();
    return;
  }
  previousFocus = document.activeElement;
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  const dialog = document.createElement("section");
  dialog.className =
    "modal" + (template.classList.contains("narrow") ? " narrow" : "");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", template.title || "Pratinjau");
  dialog.tabIndex = -1;
  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Tutup");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", closePreview);
  dialog.append(closeButton, template.content.cloneNode(true));
  overlay.append(dialog);
  modalRoot.replaceChildren(overlay);
  document.body.classList.add("modal-open");
  dialog.focus();
}

function toggleSidebar(open) {
  document.querySelector(".sidebar")?.classList.toggle("open", open);
  document.querySelector(".admin-overlay")?.classList.toggle("open", open);
  document
    .querySelector(".admin-mobile-toggle")
    ?.setAttribute("aria-expanded", String(open));
}

// Data paket tetap, hanya untuk menampilkan ringkasan sesuai tautan yang dipilih.
const examplePackages = {
  1: { name: "1 Day", days: 1, original: 12000, price: 12000 },
  2: { name: "7 Day", days: 7, original: 84000, price: 79000 },
  3: { name: "30 Day", days: 30, original: 360000, price: 325000 },
};
const rupiah = (value) => "Rp " + value.toLocaleString("id-ID");
// Pertahankan tanggal dan frekuensi pada tautan kembali, tanpa menyimpan alamat.
const deliverySettings = new URLSearchParams(location.search);
if (document.getElementById("checkout-form")) {
  const dateValue = deliverySettings.get("mulai");
  if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue))
    document.getElementById("start").value = dateValue;
  const frequencyIndex = { 5: 0, 6: 1, 7: 2 }[deliverySettings.get("hari")];
  if (frequencyIndex !== undefined)
    document.getElementById("frequency").selectedIndex = frequencyIndex;
  document.getElementById("time").selectedIndex =
    deliverySettings.get("waktu") === "malam" ? 1 : 0;
}
const summary = document.getElementById("checkout-package");
if (summary) {
  const packageId = new URLSearchParams(location.search).get("paket") || "3";
  const selectedPackage = examplePackages[packageId] || examplePackages[3];
  summary.querySelector("h3").textContent = selectedPackage.name;
  summary.querySelector("small").textContent =
    `${selectedPackage.days}x makanan disiapkan sesuai jadwal pilihanmu.`;
  document.getElementById("checkout-original").textContent = rupiah(
    selectedPackage.original,
  );
  document.getElementById("checkout-saving").textContent =
    "−" + rupiah(selectedPackage.original - selectedPackage.price);
  document.getElementById("checkout-total").textContent = rupiah(
    selectedPackage.price,
  );
}

// Filter bekerja pada elemen HTML yang sudah ada, tanpa mengubah data contoh.
const reviewGrid = document.querySelector(".review-grid");
const exampleReviews = reviewGrid
  ? [...reviewGrid.querySelectorAll(".review")]
  : [];
let reviewPage = 1;
function filterReviews() {
  if (!reviewGrid) return;
  const menu = document.getElementById("review-menu-filter").value;
  const sort = document.getElementById("review-sort").value;
  const rating = (card) =>
    Number(
      card
        .querySelector(".stars")
        .getAttribute("aria-label")
        .match(/\d+/)?.[0] || 0,
    );
  const ordered = [...exampleReviews];
  if (sort === "old") ordered.reverse();
  if (sort === "high") ordered.sort((a, b) => rating(b) - rating(a));
  ordered.forEach((card) => reviewGrid.append(card));
  const visible = ordered.filter(
    (card) =>
      !menu ||
      card.querySelector(".review-menu-label strong").textContent === menu,
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / 2));
  reviewPage = Math.min(reviewPage, totalPages);
  exampleReviews.forEach((card) => {
    card.hidden = true;
  });
  visible.slice((reviewPage - 1) * 2, reviewPage * 2).forEach((card) => {
    card.hidden = false;
  });
  document.querySelectorAll("[data-review-page]").forEach((button) => {
    const label = button.getAttribute("aria-label");
    if (label === "Sebelumnya")
      button.dataset.reviewPage = Math.max(1, reviewPage - 1);
    else if (label === "Berikutnya")
      button.dataset.reviewPage = Math.min(totalPages, reviewPage + 1);
    else {
      const number = Number(button.textContent);
      button.hidden = number > totalPages;
      button.classList.toggle("active", number === reviewPage);
    }
  });
}

const historyRows = [...document.querySelectorAll("#history-list tbody tr")];
let historyPage = 1;
function filterHistory() {
  if (!historyRows.length) return;
  const status = document.getElementById("history-status").value;
  const month = document.getElementById("history-month").value;
  const visible = historyRows.filter(
    (row) =>
      (status === "Semua" ||
        row.querySelector(".badge").textContent.trim() === status) &&
      month === "2026-11",
  );
  const pages = Math.max(1, Math.ceil(visible.length / 6));
  historyPage = Math.min(historyPage, pages);
  historyRows.forEach((row) => {
    row.hidden = true;
  });
  visible.slice((historyPage - 1) * 6, historyPage * 6).forEach((row) => {
    row.hidden = false;
  });
  let empty = document.getElementById("history-empty");
  if (!empty) {
    empty = document.createElement("tr");
    empty.id = "history-empty";
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "empty";
    cell.textContent = "Tidak ada pesanan pada pilihan ini.";
    empty.append(cell);
    document.querySelector("#history-list tbody").append(empty);
  }
  empty.hidden = visible.length > 0;
  document.querySelectorAll("[data-history-page]").forEach((button) => {
    button.hidden = Number(button.dataset.historyPage) > pages;
    button.classList.toggle(
      "active",
      Number(button.dataset.historyPage) === historyPage,
    );
  });
  document.querySelector("#history-list .pagination small").textContent =
    `${visible.length} pengantaran · data contoh`;
}

function filterAdmin() {
  const query =
    document.getElementById("admin-search")?.value.toLowerCase() || "";
  const status =
    document.getElementById("admin-filter")?.value || "Semua status";
  document
    .querySelectorAll(
      "#customer-list tbody tr, #subscription-list tbody tr, #package-list tbody tr, #admin-menu-list .menu-card",
    )
    .forEach((element) => {
      const state = element
        .querySelector(".badge, .menu-bottom small")
        ?.textContent.trim();
      element.hidden =
        !element.textContent.toLowerCase().includes(query) ||
        (status !== "Semua status" && state !== status);
    });
}

function filterAdminReviews() {
  const rows = [...document.querySelectorAll("#admin-rating-data tbody tr")];
  if (!rows.length) return;
  const query = document.getElementById("rating-search").value.toLowerCase();
  const menu = document.getElementById("rating-menu").value;
  const stars = document.getElementById("rating-stars").value;
  let count = 0;
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const matches =
      row.textContent.toLowerCase().includes(query) &&
      (!menu || cells[1].querySelector("b").textContent === menu) &&
      (!stars || cells[2].querySelector("small").textContent.startsWith(stars));
    row.hidden = !matches;
    if (matches) count++;
  });
  document.querySelector(".rating-result-count").textContent =
    `Menampilkan ${count} dari ${rows.length} ulasan`;
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("overlay")) closePreview();
  if (event.target.classList.contains("admin-overlay")) toggleSidebar(false);
  const button = event.target.closest("button, a");
  if (!button) return;
  if (button.matches(".mobile-toggle")) {
    const open = document.querySelector(".navlinks").classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  }
  if (button.matches(".navlinks a")) {
    document.querySelector(".navlinks").classList.remove("open");
    document
      .querySelector(".mobile-toggle")
      .setAttribute("aria-expanded", "false");
  }
  if (button.matches(".admin-mobile-toggle"))
    toggleSidebar(
      !document.querySelector(".sidebar").classList.contains("open"),
    );
  if (button.hasAttribute("data-close")) closePreview();
  if (button.dataset.menu) openPreview("preview-menu-" + button.dataset.menu);
  if (button.dataset.review)
    openPreview("preview-review-" + button.dataset.review);
  if (button.dataset.add) openPreview("preview-add-" + button.dataset.add);
  if (button.dataset.edit)
    openPreview("preview-edit-" + button.dataset.edit.replace(":", "-"));
  if (button.dataset.delete) openPreview("preview-delete");
  if (button.hasAttribute("data-forgot")) openPreview("preview-forgot");
  if (button.id === "continue-to-menus") {
    const query = new URLSearchParams();
    query.set(
      "paket",
      new URLSearchParams(location.search).get("paket") || "3",
    );
    query.set("mulai", document.getElementById("start").value || "2026-11-02");
    query.set(
      "hari",
      document.getElementById("frequency").selectedIndex === 0
        ? "5"
        : document.getElementById("frequency").selectedIndex === 1
          ? "6"
          : "7",
    );
    query.set(
      "waktu",
      document.getElementById("time").selectedIndex === 0 ? "siang" : "malam",
    );
    location.href = "atur-menu.html?" + query.toString();
  }
  if (button.dataset.plan) {
    if (isCustomer)
      location.href = new URL(
        "pelanggan/pemesanan.html?paket=" + button.dataset.plan,
        rootUrl,
      ).href;
    else openPreview("preview-login-required");
  }
  if (button.dataset.choose) {
    closePreview();
    showNotice("Pilihan menu hanya contoh tampilan, tidak disimpan.");
  }
  if (button.hasAttribute("data-preview-action")) {
    closePreview();
    showNotice();
  }
  if (button.dataset.star) {
    const value = Number(button.dataset.star);
    document.querySelectorAll(".modal [data-star]").forEach((star) => {
      star.classList.toggle("on", Number(star.dataset.star) <= value);
      star.setAttribute(
        "aria-pressed",
        String(Number(star.dataset.star) === value),
      );
    });
  }
  if (button.hasAttribute("data-chip")) {
    button.parentElement
      .querySelectorAll("button")
      .forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  }
  if (button.dataset.reviewPage) {
    reviewPage = Number(button.dataset.reviewPage);
    filterReviews();
  }
  if (button.dataset.historyPage) {
    historyPage = Number(button.dataset.historyPage);
    filterHistory();
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  closePreview();
  showNotice();
});

document.addEventListener("input", (event) => {
  if (event.target.id === "menu-search") {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll("#menu-list .menu-card").forEach((card) => {
      card.hidden = !card
        .querySelector("h3")
        .textContent.toLowerCase()
        .includes(query);
    });
  }
  if (event.target.id === "admin-search") filterAdmin();
  if (event.target.id === "rating-search") filterAdminReviews();
  if (event.target.id === "review-text")
    document.querySelector(".modal #review-count").textContent =
      event.target.value.length + "/300";
});

document.addEventListener("change", (event) => {
  if (["review-menu-filter", "review-sort"].includes(event.target.id)) {
    reviewPage = 1;
    filterReviews();
  }
  if (["history-status", "history-month"].includes(event.target.id)) {
    historyPage = 1;
    filterHistory();
  }
  if (event.target.id === "admin-filter") filterAdmin();
  if (["rating-menu", "rating-stars"].includes(event.target.id))
    filterAdminReviews();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePreview();
    toggleSidebar(false);
  }
  const dialog = modalRoot.querySelector(".modal");
  if (event.key !== "Tab" || !dialog) return;
  const controls = [
    ...dialog.querySelectorAll(
      "button:not(:disabled), a[href], input:not([type=hidden]), select, textarea",
    ),
  ];
  const first = controls[0],
    last = controls.at(-1);
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === dialog)
  ) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});

filterReviews();
filterHistory();
