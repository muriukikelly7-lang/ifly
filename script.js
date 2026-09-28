const flightForm = document.querySelector("#flight-search");
const tripControl = document.querySelector('select[name="trip"]');
const returnField = document.querySelector(".return-field");
const returnInput = document.querySelector('input[name="return"]');
const departureInput = document.querySelector('input[name="depart"]');
const fromSelect = document.querySelector('select[name="from"]');
const toSelect = document.querySelector('select[name="to"]');
const bookingMessage = document.querySelector("#booking-message");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const toast = document.querySelector("#toast");

const routeFares = {
  "Nairobi|Wajir": 12000,
  "Nairobi|Mandera": 13200,
  "Nairobi|Juba": 25000,
  "Nairobi|Mogadishu": 21000,
  "Wajir|Nairobi": 12000,
  "Mandera|Nairobi": 13200,
  "Juba|Nairobi": 25000,
  "Mogadishu|Nairobi": 21000
};

const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function normalizeCityName(city) {
  if (!city) return "";
  return city.replace(/\s*\([^)]*\)/g, "").trim();
}

function parsePassengerCount(passengerValue) {
  const match = String(passengerValue || "1 passenger").match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function formatKsh(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(amount);
}

function getRouteFare(from, to) {
  const normalizedFrom = normalizeCityName(from);
  const normalizedTo = normalizeCityName(to);
  const routeKey = [normalizedFrom, normalizedTo].sort().join("|");
  return routeFares[routeKey] || 0;
}

function getEstimatedFare(from, to, passengerValue) {
  const passengerCount = parsePassengerCount(passengerValue);
  const routeFare = getRouteFare(from, to);
  const totalFare = routeFare ? routeFare * passengerCount : 0;

  return {
    passengerCount,
    routeFare,
    totalFare,
    formattedFare: routeFare ? formatKsh(routeFare) : "Contact for quote",
    formattedTotalFare: routeFare ? formatKsh(totalFare) : "Contact for quote"
  };
}

if (departureInput) departureInput.min = localDate;
if (returnInput) returnInput.min = localDate;

function updateTripType() {
  if (!tripControl || !returnField || !returnInput) return;
  const oneWay = tripControl.value === "oneway";
  returnField.hidden = oneWay;
  returnInput.required = !oneWay;
}

if (tripControl) tripControl.addEventListener("change", updateTripType);

if (departureInput) {
  departureInput.addEventListener("change", () => {
    if (!returnInput) return;
    returnInput.min = departureInput.value || localDate;
    if (returnInput.value && returnInput.value < departureInput.value) returnInput.value = "";
  });
}

document.querySelector(".swap-button")?.addEventListener("click", () => {
  if (!fromSelect || !toSelect) return;
  const departing = fromSelect.value;
  const arriving = toSelect.value;
  if (!arriving) return;
  fromSelect.value = arriving;
  toSelect.value = departing;
});

flightForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!fromSelect || !toSelect) return;
  if (fromSelect.value === toSelect.value) {
    bookingMessage.textContent = "Choose two different cities to find a flight.";
    toSelect.focus();
    return;
  }

  const tripValue = tripControl ? tripControl.value : "roundtrip";
  const departValue = departureInput ? departureInput.value || "TBD" : "TBD";
  const passengerValue = document.querySelector('select[name="passengers"]')?.value || "1 passenger";
  const estimatedFare = getEstimatedFare(fromSelect.value, toSelect.value, passengerValue);

  const params = new URLSearchParams({
    from: fromSelect.value,
    to: toSelect.value,
    trip: tripValue,
    depart: departValue,
    passengers: passengerValue,
    fare: String(estimatedFare.totalFare)
  });

  window.location.href = `booking-details.html?${params.toString()}`;
});

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    mainNav.classList.toggle("open", !isOpen);
  });

  mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    mainNav.classList.remove("open");
  }));
}

updateTripType();

const bookingDetailForm = document.querySelector("#booking-details-form");
if (bookingDetailForm) {
  const summaryRoute = document.querySelector("#summary-route");
  const summaryDepart = document.querySelector("#summary-depart");
  const summaryPassengers = document.querySelector("#summary-passengers");
  const params = new URLSearchParams(window.location.search);

  const from = params.get("from") || "Nairobi";
  const to = params.get("to") || "Mombasa";
  const trip = params.get("trip") || "roundtrip";
  const depart = params.get("depart") || "TBD";
  const passengers = params.get("passengers") || "1 passenger";
  const fareValue = Number(params.get("fare") || 0);
  const fareEstimate = getEstimatedFare(from, to, passengers);
  const finalFare = fareValue > 0 ? fareValue : fareEstimate.totalFare;

  const summaryFare = document.querySelector("#summary-fare");

  if (summaryRoute) summaryRoute.textContent = `${normalizeCityName(from)} → ${normalizeCityName(to)}`;
  if (summaryDepart) summaryDepart.textContent = trip === "oneway" ? `${depart} (one-way)` : `${depart}`;
  if (summaryPassengers) summaryPassengers.textContent = passengers;
  if (summaryFare) summaryFare.textContent = finalFare > 0 ? `${formatKsh(finalFare)} total` : "Contact for quote";

  bookingDetailForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(bookingDetailForm);
    const fullName = formData.get("fullName")?.toString().trim();
    const idNumber = formData.get("idNumber")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const notes = formData.get("notes")?.toString().trim();

    if (!fullName || !idNumber || !email || !phone) {
      bookingDetailForm.reportValidity();
      return;
    }

    const totalFareText = finalFare > 0 ? `Estimated fare: ${formatKsh(finalFare)}` : "Estimated fare: Please contact reservations";

    const whatsappMessage = [
      "Hello iFly, I would like to confirm my booking.",
      `Full name: ${fullName}`,
      `ID/Passport: ${idNumber}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Trip: ${normalizeCityName(from)} to ${normalizeCityName(to)}`,
      `Departure: ${depart}`,
      `Passengers: ${passengers}`,
      totalFareText,
      notes ? `Notes: ${notes}` : "",
    ].filter(Boolean).join("\n");

    const url = `https://wa.me/254736989645?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}