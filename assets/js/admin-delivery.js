"use strict";

// Data tetap untuk pratinjau operasional. Tidak membaca/menulis penyimpanan.
const deliveryDemoToday = "2026-11-02";
const deliveryDemoTomorrow = "2026-11-03";
const adminDeliveryQuery = new URLSearchParams(location.search);
const deliveryMenus = {
  1: { name: "Mie Ayam", image: "mie-ayam.jpg" },
  2: { name: "Rawon Ayam", image: "rawon-ayam.jpg" },
  3: { name: "Ayam Goreng", image: "ayam-goreng.jpg" },
  4: { name: "Nasi Uduk", image: "nasi-uduk.jpg" },
  5: { name: "Nasi Goreng", image: "nasi-goreng.jpg" },
  6: { name: "Rendang Sapi", image: "rendang-sapi.jpg" },
  7: { name: "Bakso", image: "bakso.jpg" },
  8: { name: "Sate Ayam", image: "sate-ayam.jpg" },
};
const deliveryCustomers = [
  {
    id: 1,
    name: "Nadia Putri",
    code: "BR-0001",
    days: 30,
    package: "30 Day",
    start: "2026-11-02",
    status: "Aktif",
    address: "Politeknik Batam",
    area: "Batam Centre · Rumah",
    phone: "0812 3456 7890",
    weekdays: 5,
    time: "11.00–13.00 WIB",
    holidays: ["2026-11-05"],
    pattern: [7, 3, 6, 4, 8, 2, 5],
    done: 7,
  },
  {
    id: 2,
    name: "Siti Aisyah",
    code: "BR-0002",
    days: 7,
    package: "7 Day",
    start: "2026-11-02",
    status: "Aktif",
    address: "Batam Centre",
    area: "Batam · Rumah",
    phone: "0813 8899 2211",
    weekdays: 5,
    time: "11.00–13.00 WIB",
    holidays: ["2026-11-04"],
    pattern: [7, 4, 7, 6, 3, 1, 5],
    done: 3,
  },
  {
    id: 3,
    name: "Dewi Lestari",
    code: "BR-0003",
    days: 30,
    package: "30 Day",
    start: "2026-11-02",
    status: "Dijeda",
    address: "Batu Aji, Batam",
    area: "Batu Aji · Rumah",
    phone: "0821 3456 7822",
    weekdays: 5,
    time: "11.00–13.00 WIB",
    holidays: [],
    pattern: [7, 3, 6, 4, 8, 2, 5],
    done: 12,
  },
  {
    id: 4,
    name: "Andi Saputra",
    code: "BR-0004",
    days: 1,
    package: "1 Day",
    start: "2026-11-01",
    status: "Selesai",
    address: "Bengkong, Batam",
    area: "Bengkong · Rumah",
    phone: "0812 9988 7766",
    weekdays: 7,
    time: "11.00–13.00 WIB",
    holidays: [],
    pattern: [8, 3, 6, 4, 8, 2, 5],
    done: 1,
  },
];
const deliveryDate = (value) => new Date(value + "T12:00:00");
const deliveryKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const deliveryAddDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const deliveryDateText = (value, long = false) =>
  deliveryDate(value).toLocaleDateString("id-ID", {
    ...(long ? { weekday: "long" } : {}),
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  });
const deliveryEsc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
function isDeliveryDay(customer, date) {
  return (
    customer.weekdays === 7 ||
    (date.getDay() !== 0 && (customer.weekdays === 6 || date.getDay() !== 6))
  );
}
function customerDeliveryDates(customer) {
  const dates = [];
  for (
    let date = deliveryDate(customer.start);
    dates.length < customer.days;
    date = deliveryAddDays(date, 1)
  ) {
    const key = deliveryKey(date);
    if (isDeliveryDay(customer, date) && !customer.holidays.includes(key))
      dates.push(key);
  }
  return dates;
}
function deliveryEntry(customer, key, showOutside = false) {
  const dates = customerDeliveryDates(customer);
  const date = deliveryDate(key);
  const outside = key < customer.start || key > dates.at(-1);
  if (outside && !showOutside) return null;
  let status = "Menunggu";
  if (outside) status = "Di luar paket";
  else if (customer.status === "Dibatalkan") status = "Dibatalkan";
  else if (customer.status === "Dijeda") status = "Dijeda";
  else if (!isDeliveryDay(customer, date) || customer.holidays.includes(key))
    status = "Libur";
  else if (key < deliveryDemoToday || customer.status === "Selesai")
    status = "Selesai";
  else if (key === deliveryDemoToday)
    status = customer.id === 2 ? "Selesai" : "Diproses";
  const menu = deliveryMenus[customer.pattern[date.getDay()]];
  return {
    customer,
    date: key,
    menu,
    status,
    portions: ["Libur", "Dijeda", "Dibatalkan", "Di luar paket"].includes(
      status,
    )
      ? 0
      : 1,
  };
}
function deliveriesOn(key) {
  return deliveryCustomers
    .map((customer) => deliveryEntry(customer, key))
    .filter(Boolean);
}
function deliveryRecap(rows) {
  const groups = new Map();
  rows
    .filter((row) => row.portions > 0)
    .forEach((row) => {
      if (!groups.has(row.menu.name))
        groups.set(row.menu.name, {
          menu: row.menu,
          portions: 0,
          customers: [],
        });
      const group = groups.get(row.menu.name);
      group.portions += row.portions;
      group.customers.push(row.customer.name);
    });
  return [...groups.values()];
}
const deliveryBadge = (status) =>
  `<span class="badge ${status === "Selesai" || status === "Aktif" ? "green" : ["Diproses", "Dikirim", "Menunggu"].includes(status) ? "orange" : ""}">${deliveryEsc(status)}</span>`;
const menuCell = (menu) =>
  `<div class="table-img"><img src="../assets/images/${menu.image}" alt="${menu.name}"><b>${menu.name}</b></div>`;
const deliveryPage = document.getElementById("delivery-page");
function renderDailyDeliveries() {
  if (!deliveryPage) return;
  const input = document.getElementById("delivery-date");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.value) ||
    Number.isNaN(deliveryDate(input.value).getTime())
  )
    input.value = deliveryDemoToday;
  const date = input.value;
  const rows = deliveriesOn(date);
  const active = rows.filter((row) => row.portions > 0);
  const portions = active.reduce((total, row) => total + row.portions, 0);
  const done = active.filter((row) => row.status === "Selesai").length;
  document.getElementById("delivery-active-count").textContent = active.length;
  document.getElementById("delivery-portion-count").textContent = portions;
  document.getElementById("delivery-done-count").textContent = done;
  document.getElementById("delivery-pending-count").textContent =
    active.length - done;
  document.getElementById("delivery-date-caption").textContent =
    deliveryDateText(date, true);
  document
    .getElementById("delivery-today")
    .classList.toggle("active", date === deliveryDemoToday);
  document
    .getElementById("delivery-tomorrow")
    .classList.toggle("active", date === deliveryDemoTomorrow);
  const query = document.getElementById("delivery-search").value.toLowerCase();
  const status = document.getElementById("delivery-status").value;
  const shown = rows.filter(
    (row) =>
      (!status ||
        (status === "belum-selesai"
          ? row.portions > 0 && row.status !== "Selesai"
          : row.status === status)) &&
      [row.customer.name, row.menu.name, row.customer.address]
        .join(" ")
        .toLowerCase()
        .includes(query),
  );
  document.getElementById("delivery-result-count").textContent =
    `Menampilkan ${shown.length} dari ${rows.length} jadwal · ${active.length} pengantaran aktif`;
  document.getElementById("delivery-table-body").innerHTML =
    shown
      .map(
        (row) =>
          `<tr class="${row.portions ? "" : "delivery-excluded"}"><td><b>${row.customer.name}</b><small>#${row.customer.code}</small></td><td>${menuCell(row.menu)}</td><td>${row.portions ? row.portions + " porsi" : "—"}</td><td>${row.customer.address}<small>${row.customer.area}</small></td><td>${row.customer.time}</td><td>${deliveryBadge(row.status)}${row.portions ? "" : "<small>Tidak dihitung</small>"}</td><td><a class="delivery-row-link" href="jadwal-menu.html?langganan=${row.customer.id}&tanggal=${date}">Lihat jadwal →</a></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="7" class="empty">Tidak ada pengantaran sesuai pilihan ini.</td></tr>';
  const groups = deliveryRecap(rows);
  document.getElementById("recap-menu-count").textContent =
    groups.length + " jenis menu";
  document.getElementById("recap-date-label").textContent = deliveryDateText(
    date,
    true,
  );
  document.querySelector(".delivery-recap-heading h2").textContent =
    date === deliveryDemoTomorrow
      ? "Kebutuhan menu besok"
      : "Kebutuhan menu harian";
  document.getElementById("delivery-recap-body").innerHTML =
    groups
      .map(
        (group) =>
          `<tr><td>${menuCell(group.menu)}</td><td><strong>${group.portions} porsi</strong></td><td>${group.customers.join(", ")}</td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="3" class="empty">Tidak ada kebutuhan porsi pada tanggal ini.</td></tr>';
  document.getElementById("recap-total-portions").textContent =
    portions + " porsi";
  document.getElementById("recap-total-deliveries").textContent =
    active.length + " pengantaran aktif";
  const excluded = rows.length - active.length;
  document.getElementById("recap-excluded-note").textContent = excluded
    ? `${excluded} jadwal libur, dijeda, atau dibatalkan tidak dihitung dalam rekap.`
    : "Semua jadwal pada tanggal ini masuk perhitungan porsi.";
}
function switchDeliveryView(recap) {
  document.getElementById("delivery-list-panel").hidden = recap;
  document.getElementById("delivery-recap-panel").hidden = !recap;
  for (const [id, selected] of [
    ["delivery-list-tab", !recap],
    ["delivery-recap-tab", recap],
  ]) {
    document.getElementById(id).classList.toggle("active", selected);
    document.getElementById(id).setAttribute("aria-selected", String(selected));
  }
}
if (deliveryPage) {
  const requestedDate = adminDeliveryQuery.get("tanggal");
  if (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || ""))
    document.getElementById("delivery-date").value = requestedDate;
  const option = document.createElement("option");
  option.value = "belum-selesai";
  option.textContent = "Belum selesai";
  document.getElementById("delivery-status").append(option);
  if (
    [...document.getElementById("delivery-status").options].some(
      (item) => item.value === adminDeliveryQuery.get("status"),
    )
  )
    document.getElementById("delivery-status").value =
      adminDeliveryQuery.get("status");
  renderDailyDeliveries();
  switchDeliveryView(adminDeliveryQuery.get("tampilan") === "rekap");
}

// Detail pilihan menu per pelanggan. Admin hanya melihat, bukan mengubah.
const customerMenuPage = document.getElementById("customer-menu-page");
const menuScheduleCustomer =
  deliveryCustomers.find(
    (customer) => customer.id === Number(adminDeliveryQuery.get("langganan")),
  ) || deliveryCustomers[0];
let customerMenuWeek = 0;
const customerScheduleDates = customerDeliveryDates(menuScheduleCustomer);
const customerWeekCount = Math.max(
  1,
  Math.ceil(
    (Math.round(
      (deliveryDate(customerScheduleDates.at(-1)) -
        deliveryDate(menuScheduleCustomer.start)) /
        86400000,
    ) +
      1) /
      7,
  ),
);
function renderCustomerMenus() {
  if (!customerMenuPage) return;
  const customer = menuScheduleCustomer;
  document.getElementById("customer-menu-avatar").textContent =
    customer.name[0];
  document.getElementById("customer-menu-name").textContent = customer.name;
  document.getElementById("customer-menu-code").textContent =
    "#" + customer.code;
  document.getElementById("customer-menu-package").textContent =
    "Paket " + customer.package;
  const status = document.getElementById("customer-menu-status");
  status.textContent = customer.status;
  status.className =
    "badge " +
    (customer.status === "Aktif" || customer.status === "Selesai"
      ? "green"
      : "orange");
  document.getElementById("customer-menu-address").textContent =
    customer.address;
  document.getElementById("customer-menu-phone").textContent = customer.phone;
  document.getElementById("customer-menu-frequency").textContent =
    (customer.weekdays === 7 ? "Setiap hari" : "Senin–Jumat") +
    " · " +
    customer.time;
  document.getElementById("customer-menu-progress").textContent =
    customer.days + " jadwal pengantaran dalam paket · data contoh";
  const start = deliveryAddDays(
    deliveryDate(customer.start),
    customerMenuWeek * 7,
  );
  document.getElementById("customer-menu-week-label").textContent =
    deliveryDateText(deliveryKey(start)) +
    " – " +
    deliveryDateText(deliveryKey(deliveryAddDays(start, 6)));
  document.getElementById("customer-menu-week-count").textContent =
    `Minggu ${customerMenuWeek + 1} dari ${customerWeekCount}`;
  document.getElementById("customer-week-previous").disabled =
    customerMenuWeek === 0;
  document.getElementById("customer-week-next").disabled =
    customerMenuWeek === customerWeekCount - 1;
  const rows = Array.from({ length: 7 }, (_, index) =>
    deliveryEntry(customer, deliveryKey(deliveryAddDays(start, index)), true),
  );
  document.getElementById("customer-menu-body").innerHTML = rows
    .map(
      (row) =>
        `<tr class="${row.portions ? "" : "delivery-excluded"}"><td><b>${deliveryDateText(row.date, true)}</b>${row.date === deliveryDemoToday ? '<small class="accent">Hari ini</small>' : row.date === deliveryDemoTomorrow ? '<small class="accent">Besok</small>' : ""}</td><td>${row.portions ? menuCell(row.menu) : `<span class="muted">${row.status === "Libur" ? "Tidak ada pengiriman" : row.status === "Dijeda" ? "Langganan sedang dijeda" : row.status === "Di luar paket" ? "Di luar periode paket" : "Pengantaran dibatalkan"}</span>`}</td><td>${row.portions ? "1 porsi" : "—"}</td><td>${deliveryBadge(row.status)}</td><td>${row.status === "Di luar paket" ? "—" : `<a class="delivery-row-link" href="pengantaran.html?tanggal=${row.date}">Lihat pengantaran →</a>`}</td></tr>`,
    )
    .join("");
}
if (customerMenuPage) {
  const date = adminDeliveryQuery.get("tanggal");
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || ""))
    customerMenuWeek = Math.max(
      0,
      Math.min(
        customerWeekCount - 1,
        Math.floor(
          (deliveryDate(date) - deliveryDate(menuScheduleCustomer.start)) /
            86400000 /
            7,
        ),
      ),
    );
  renderCustomerMenus();
}
if (document.getElementById("dashboard-delivery-today")) {
  const today = deliveriesOn(deliveryDemoToday).filter(
    (row) => row.portions > 0,
  );
  const tomorrow = deliveriesOn(deliveryDemoTomorrow);
  document.getElementById("dashboard-delivery-today").textContent =
    today.length;
  document.getElementById("dashboard-portions-tomorrow").textContent =
    tomorrow.reduce((count, row) => count + row.portions, 0);
  document.getElementById("dashboard-delivery-pending").textContent =
    today.filter((row) => row.status !== "Selesai").length;
  document.getElementById("dashboard-tomorrow-menu").innerHTML =
    deliveryRecap(tomorrow)
      .map(
        (group) =>
          `<div class="delivery-mini-menu"><img src="../assets/images/${group.menu.image}" alt="${group.menu.name}"><span>${group.menu.name}<small>${group.customers.join(", ")}</small></span><b>${group.portions} porsi</b></div>`,
      )
      .join("") ||
    '<p class="empty">Tidak ada pengantaran aktif untuk besok.</p>';
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.id === "delivery-today" || button.id === "delivery-tomorrow") {
    document.getElementById("delivery-date").value =
      button.id === "delivery-today" ? deliveryDemoToday : deliveryDemoTomorrow;
    renderDailyDeliveries();
  }
  if (button.id === "delivery-list-tab" || button.id === "delivery-recap-tab")
    switchDeliveryView(button.id === "delivery-recap-tab");
  if (button.id === "customer-week-previous") {
    customerMenuWeek = Math.max(0, customerMenuWeek - 1);
    renderCustomerMenus();
  }
  if (button.id === "customer-week-next") {
    customerMenuWeek = Math.min(customerWeekCount - 1, customerMenuWeek + 1);
    renderCustomerMenus();
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "delivery-search") renderDailyDeliveries();
});
document.addEventListener("change", (event) => {
  if (["delivery-date", "delivery-status"].includes(event.target.id))
    renderDailyDeliveries();
});
