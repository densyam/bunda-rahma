"use strict";

// Pratinjau jadwal menu. Pilihan hanya ada sementara pada tampilan/URL,
// tanpa penyimpanan browser, database, atau permintaan ke server.
const menuPlanner = document.getElementById("menu-planner");
const myMenuSchedule = document.getElementById("my-menu-schedule");
const menuPayment = document.getElementById("schedule-payment");
const scheduleQuery = new URLSearchParams(location.search);
const schedulePackageId = ["1", "2", "3"].includes(scheduleQuery.get("paket"))
  ? scheduleQuery.get("paket")
  : "3";
const schedulePackage = examplePackages[schedulePackageId];
const deliveryWeekdays = [5, 6, 7].includes(Number(scheduleQuery.get("hari")))
  ? Number(scheduleQuery.get("hari"))
  : 5;
const deliveryTime =
  scheduleQuery.get("waktu") === "malam"
    ? "17.00–19.00 WIB"
    : "11.00–13.00 WIB";
const scheduleMenuOptions = [
  { id: 1, name: "Mie Ayam", image: "mie-ayam.jpg" },
  { id: 2, name: "Rawon Ayam", image: "rawon-ayam.jpg" },
  { id: 3, name: "Ayam Goreng", image: "ayam-goreng.jpg" },
  { id: 4, name: "Nasi Uduk", image: "nasi-uduk.jpg" },
  { id: 5, name: "Nasi Goreng", image: "nasi-goreng.jpg" },
  { id: 6, name: "Rendang Sapi", image: "rendang-sapi.jpg" },
  { id: 7, name: "Bakso", image: "bakso.jpg" },
  { id: 8, name: "Sate Ayam", image: "sate-ayam.jpg" },
];
const recommendationPattern = { 1: 3, 2: 6, 3: 4, 4: 8, 5: 2, 6: 5, 0: 7 };
let weeklyMenuPattern = { ...recommendationPattern };
let calendarWeek = 0;
let chosenDelivery = null;
let calendarMode = "recommendation";
const holidays = new Set();
const selectedMenus = new Map();
for (const value of (scheduleQuery.get("libur") || "")
  .split(",")
  .slice(0, 60)) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) holidays.add(value);
}
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dayAfter = (date, offset) => {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
};
const dateText = (date) =>
  date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const dayText = (date) => date.toLocaleDateString("id-ID", { weekday: "long" });
const startValue = scheduleQuery.get("mulai") || "2026-11-02";
let firstDeliveryDate = /^\d{4}-\d{2}-\d{2}$/.test(startValue)
  ? new Date(startValue + "T12:00:00")
  : new Date("2026-11-02T12:00:00");
if (
  Number.isNaN(firstDeliveryDate.getTime()) ||
  firstDeliveryDate.getFullYear() < 2020 ||
  firstDeliveryDate.getFullYear() > 2100
)
  firstDeliveryDate = new Date("2026-11-02T12:00:00");
const shipsOn = (date) =>
  deliveryWeekdays === 7 ||
  (date.getDay() !== 0 && (deliveryWeekdays === 6 || date.getDay() !== 6));
while (!shipsOn(firstDeliveryDate))
  firstDeliveryDate = dayAfter(firstDeliveryDate, 1);
if (myMenuSchedule && schedulePackage.days > 7 && !scheduleQuery.has("paket"))
  holidays.add(dateKey(dayAfter(firstDeliveryDate, 3)));
const suppliedChoices = (scheduleQuery.get("pilihan") || "")
  .split(",")
  .map(Number);
let scheduleDeliveries = [];
function buildDeliverySchedule() {
  scheduleDeliveries = [];
  for (
    let day = new Date(firstDeliveryDate);
    scheduleDeliveries.length < schedulePackage.days;
    day = dayAfter(day, 1)
  ) {
    if (!shipsOn(day) || holidays.has(dateKey(day))) continue;
    const index = scheduleDeliveries.length;
    const supplied = scheduleMenuOptions.some(
      (menu) => menu.id === suppliedChoices[index],
    )
      ? suppliedChoices[index]
      : null;
    const id =
      selectedMenus.get(dateKey(day)) ||
      supplied ||
      weeklyMenuPattern[day.getDay()];
    scheduleDeliveries.push({
      date: new Date(day),
      key: dateKey(day),
      menuId: id,
    });
  }
}
function canChangeDelivery(date) {
  if (!myMenuSchedule) return true;
  const previousDate = dayAfter(date, -1);
  const deadline = new Date(dateKey(previousDate) + "T17:00:00+07:00");
  return new Date() < deadline;
}
function scheduleParams(includeChoices = false) {
  const params = new URLSearchParams();
  params.set("paket", schedulePackageId);
  params.set("mulai", dateKey(firstDeliveryDate));
  params.set("hari", String(deliveryWeekdays));
  params.set(
    "waktu",
    scheduleQuery.get("waktu") === "malam" ? "malam" : "siang",
  );
  if (holidays.size) params.set("libur", [...holidays].join(","));
  if (includeChoices)
    params.set(
      "pilihan",
      scheduleDeliveries.map((item) => item.menuId).join(","),
    );
  return params;
}
function calendarWeeks() {
  const end = scheduleDeliveries.at(-1).date;
  return Math.max(
    1,
    Math.ceil((Math.round((end - firstDeliveryDate) / 86400000) + 1) / 7),
  );
}
function updateCalendar() {
  if (!menuPlanner && !myMenuSchedule) return;
  const totalWeeks = calendarWeeks();
  calendarWeek = Math.min(calendarWeek, totalWeeks - 1);
  const weekStart = dayAfter(firstDeliveryDate, calendarWeek * 7);
  const weekEnd = dayAfter(weekStart, 6);
  document.getElementById("week-date-label").textContent =
    dateText(weekStart) + " – " + dateText(weekEnd);
  document.getElementById("week-number").textContent =
    `Minggu ${calendarWeek + 1} dari ${totalWeeks}`;
  document.getElementById("previous-week").disabled = calendarWeek === 0;
  document.getElementById("next-week").disabled =
    calendarWeek === totalWeeks - 1;
  const tabs = document.getElementById("week-tabs");
  tabs.replaceChildren();
  for (let week = 0; week < totalWeeks; week++) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.week = String(week);
    button.textContent = `Minggu ${week + 1}`;
    button.classList.toggle("active", week === calendarWeek);
    button.setAttribute(
      "aria-current",
      week === calendarWeek ? "true" : "false",
    );
    tabs.append(button);
  }
  const today = dateKey(new Date());
  const tomorrow = dateKey(dayAfter(new Date(), 1));
  document.querySelectorAll(".schedule-day").forEach((card, index) => {
    const date = dayAfter(weekStart, index);
    const key = dateKey(date);
    const delivery = scheduleDeliveries.find((item) => item.key === key);
    const isHoliday = holidays.has(key);
    const outsidePackage = date > scheduleDeliveries.at(-1).date;
    const locked = !!delivery && !canChangeDelivery(date);
    const status = card.querySelector(".schedule-day-status");
    card.classList.toggle("is-break", !delivery);
    card.classList.toggle("is-locked", locked);
    card.querySelector(".schedule-day-name").textContent = dayText(date);
    const time = card.querySelector("time");
    time.textContent = dateText(date);
    time.dateTime = key;
    status.textContent = outsidePackage
      ? "Di luar paket"
      : isHoliday
        ? "Libur pilihan"
        : key === today
          ? "Hari ini"
          : key === tomorrow
            ? "Besok"
            : !shipsOn(date)
              ? "Libur"
              : "Terjadwal";
    status.className =
      "badge schedule-day-status" +
      (key === tomorrow && delivery
        ? " orange"
        : delivery && !locked
          ? " green"
          : "");
    const image = card.querySelector("img");
    image.hidden = !delivery;
    card.querySelector(".schedule-break-icon").hidden = !!delivery;
    const title = card.querySelector(".schedule-meal");
    if (delivery) {
      const menu = scheduleMenuOptions.find(
        (item) => item.id === delivery.menuId,
      );
      image.src = "../assets/images/" + menu.image;
      image.alt = menu.name;
      title.textContent = menu.name;
    } else
      title.textContent = outsidePackage
        ? "Paket sudah lengkap"
        : "Tidak ada pengiriman";
    card.querySelector(".schedule-day-help").textContent = locked
      ? "Terkunci · batas perubahan sudah lewat."
      : delivery
        ? "Nasi, lauk, sayur, dan sambal."
        : outsidePackage
          ? "Seluruh jatah pengantaran sudah terjadwal."
          : isHoliday
            ? "Jatah antar dipindah ke hari berikutnya."
            : "Mengikuti hari pengiriman pilihanmu.";
    const change = card.querySelector("[data-change-day]");
    change.hidden = !delivery;
    change.disabled = locked;
    change.textContent = locked ? "Menu terkunci" : "Ganti Menu";
    const holidayButton = card.querySelector("[data-toggle-holiday]");
    holidayButton.hidden = outsidePackage || !shipsOn(date) || locked;
    holidayButton.textContent = isHoliday
      ? "Aktifkan pengiriman"
      : "Liburkan tanggal ini";
  });
  document.getElementById("schedule-package-name").textContent =
    "Paket " + schedulePackage.name;
  document.getElementById("schedule-delivery-count").textContent =
    schedulePackage.days;
  document.getElementById("schedule-frequency").textContent =
    deliveryWeekdays === 5
      ? "Senin–Jumat"
      : deliveryWeekdays === 6
        ? "Senin–Sabtu"
        : "Setiap hari";
  document.getElementById("schedule-time").textContent = deliveryTime;
  document.getElementById("schedule-period").textContent =
    dateText(firstDeliveryDate) +
    " – " +
    dateText(scheduleDeliveries.at(-1).date);
  document.getElementById("schedule-package-state").textContent = myMenuSchedule
    ? "Langganan aktif · contoh"
    : "Menu sudah terisi";
  if (menuPlanner) {
    document.getElementById("filled-menu-count").textContent =
      scheduleDeliveries.length;
    document.getElementById("total-menu-count").textContent =
      schedulePackage.days;
    document.getElementById("back-to-address").href =
      "pemesanan.html?" + scheduleParams();
    const heading = menuPlanner.querySelector("h1");
    if (schedulePackage.days === 1)
      heading.textContent = "Menu harian, tinggal pilih.";
    else if (schedulePackage.days === 7)
      heading.textContent = "Menu seminggu, sesuai seleramu.";
    document
      .getElementById("use-recommendation")
      .classList.toggle("active", calendarMode === "recommendation");
    document
      .getElementById("use-recommendation")
      .setAttribute("aria-pressed", String(calendarMode === "recommendation"));
    document
      .getElementById("custom-weekly-pattern")
      .classList.toggle("active", calendarMode === "custom");
    document
      .getElementById("custom-weekly-pattern")
      .setAttribute("aria-pressed", String(calendarMode === "custom"));
    document.getElementById("schedule-guidance-text").textContent =
      calendarMode === "custom"
        ? "Pola pilihanmu diterapkan. Ganti Menu hanya mengubah satu tanggal, tanpa mengubah minggu lainnya."
        : "Pola rekomendasi diulang setiap minggu. Klik Ganti Menu untuk mengubah satu pengantaran saja.";
  }
}
function openPatternEditor() {
  openPreview("preview-weekly-pattern");
  document.querySelectorAll(".modal [data-pattern-field]").forEach((field) => {
    const day = Number(field.dataset.patternField);
    field.hidden =
      (deliveryWeekdays === 5 && (day === 0 || day === 6)) ||
      (deliveryWeekdays === 6 && day === 0);
    field.querySelector("select").value = String(weeklyMenuPattern[day]);
  });
}
function openDayMenuPicker(index) {
  const date = dayAfter(firstDeliveryDate, calendarWeek * 7 + index);
  const delivery = scheduleDeliveries.find(
    (item) => item.key === dateKey(date),
  );
  if (!delivery || !canChangeDelivery(date)) return;
  chosenDelivery = delivery;
  openPreview("preview-schedule-picker");
  document.querySelector(".modal #picker-delivery-date").textContent =
    `${dayText(date)}, ${dateText(date)} · pilihan saat ini: ${scheduleMenuOptions.find((item) => item.id === delivery.menuId).name}`;
  document.querySelectorAll(".modal [data-schedule-meal]").forEach((button) => {
    const selected = Number(button.dataset.scheduleMeal) === delivery.menuId;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.querySelector("span").textContent = selected
      ? "Dipilih"
      : "Pilih menu";
  });
}
buildDeliverySchedule();
updateCalendar();
if (menuPayment) {
  document.getElementById("payment-package").textContent =
    "Paket " + schedulePackage.name;
  document.getElementById("payment-deliveries").textContent =
    schedulePackage.days + " kali pengantaran";
  document.getElementById("payment-period").textContent =
    dateText(firstDeliveryDate) +
    " – " +
    dateText(scheduleDeliveries.at(-1).date);
  document.getElementById("payment-frequency").textContent =
    deliveryWeekdays === 5
      ? "Senin–Jumat"
      : deliveryWeekdays === 6
        ? "Senin–Sabtu"
        : "Setiap hari";
  document.getElementById("payment-time").textContent = deliveryTime;
  document.getElementById("payment-original").textContent = rupiah(
    schedulePackage.original,
  );
  document.getElementById("payment-discount").textContent =
    "−" + rupiah(schedulePackage.original - schedulePackage.price);
  document.getElementById("payment-total").textContent = rupiah(
    schedulePackage.price,
  );
  document.getElementById("edit-planned-menu").href =
    "atur-menu.html?" + scheduleParams(true);
  const list = document.getElementById("payment-menu-list");
  list.replaceChildren();
  scheduleDeliveries.slice(0, 5).forEach((delivery) => {
    const menu = scheduleMenuOptions.find(
      (item) => item.id === delivery.menuId,
    );
    const row = document.createElement("div");
    const image = document.createElement("img");
    image.src = "../assets/images/" + menu.image;
    image.alt = menu.name;
    const text = document.createElement("span");
    text.textContent = `${dateText(delivery.date)} · ${menu.name}`;
    row.append(image, text);
    list.append(row);
  });
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.id === "previous-week") {
    calendarWeek--;
    updateCalendar();
  }
  if (button.id === "next-week") {
    calendarWeek++;
    updateCalendar();
  }
  if (button.hasAttribute("data-week")) {
    calendarWeek = Number(button.dataset.week);
    updateCalendar();
  }
  if (button.hasAttribute("data-change-day"))
    openDayMenuPicker(Number(button.dataset.changeDay));
  if (button.id === "custom-weekly-pattern") {
    if (schedulePackage.days === 1) openDayMenuPicker(0);
    else openPatternEditor();
  }
  if (button.id === "apply-weekly-pattern") {
    document
      .querySelectorAll(".modal [data-pattern-day]")
      .forEach(
        (select) =>
          (weeklyMenuPattern[select.dataset.patternDay] = Number(select.value)),
      );
    scheduleDeliveries.forEach((delivery) => {
      if (canChangeDelivery(delivery.date))
        selectedMenus.set(
          delivery.key,
          weeklyMenuPattern[delivery.date.getDay()],
        );
    });
    calendarMode = "custom";
    buildDeliverySchedule();
    closePreview();
    updateCalendar();
    showNotice("Pola mingguan diterapkan pada pratinjau.");
  }
  if (button.hasAttribute("data-schedule-meal") && chosenDelivery) {
    selectedMenus.set(chosenDelivery.key, Number(button.dataset.scheduleMeal));
    calendarMode = "custom";
    buildDeliverySchedule();
    closePreview();
    updateCalendar();
    showNotice("Menu tanggal ini diganti pada pratinjau.");
  }
  if (button.id === "use-recommendation") {
    weeklyMenuPattern = { ...recommendationPattern };
    selectedMenus.clear();
    calendarMode = "recommendation";
    buildDeliverySchedule();
    updateCalendar();
    showNotice("Rekomendasi menu sudah terisi untuk seluruh paket.");
  }
  if (button.hasAttribute("data-toggle-holiday")) {
    const date = dayAfter(
      firstDeliveryDate,
      calendarWeek * 7 + Number(button.dataset.toggleHoliday),
    );
    if (!canChangeDelivery(date)) return;
    const key = dateKey(date);
    if (holidays.has(key)) holidays.delete(key);
    else holidays.add(key);
    buildDeliverySchedule();
    updateCalendar();
    showNotice(
      "Jadwal libur diubah pada pratinjau. Jumlah pengantaran tetap sama.",
    );
  }
  if (button.id === "continue-to-summary")
    location.href = "pembayaran.html?" + scheduleParams(true);
  if (button.id === "preview-schedule-success") {
    openPreview("preview-schedule-success-dialog");
    document.querySelector('.modal a[href="jadwal-menu.html"]').href =
      "jadwal-menu.html?" + scheduleParams(true);
  }
});
