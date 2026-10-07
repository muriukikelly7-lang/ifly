const flightForm = document.querySelector("#flight-search");
const tripControl = document.querySelector('select[name="trip"]');
const returnField = document.querySelector(".return-field");
const returnInput = document.querySelector('input[name="return"]');
const departureInput = document.querySelector('input[name="depart"]');
const fromSelect = document.querySelector('select[name="from"]');
const toSelect = document.querySelector('select[name="to"]');
const bookingMessage = document.querySelector("#booking-message");
const passengerSelect = document.querySelector('select[name="passengers"]');
const fareEstimateTotal = document.querySelector("#fare-estimate-total");
const fareEstimateBreakdown = document.querySelector("#fare-estimate-breakdown");
const seatGrid = document.querySelector("#seat-grid");
const seatSelectionHint = document.querySelector("#seat-selection-hint");
const seatSelectionStatus = document.querySelector("#seat-selection-status");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const toast = document.querySelector("#toast");

const routeFares = {
  "Nairobi|Wajir": 9000,
  "Wajir|Nairobi": 9000,
  "Nairobi|Lamu": 7000,
  "Lamu|Nairobi": 7000,
  "Nairobi|Mandera": 13200,
  "Mandera|Nairobi": 13200,
  "Nairobi|Juba": 20000,
  "Juba|Nairobi": 20000,
  "Nairobi|Mogadishu": 25000,
  "Mogadishu|Nairobi": 25000
};

const seatColumns = ["A", "B", "C", "D"];
const reservedSeats = new Set(["A1", "B2", "C3", "C5", "B6", "A7", "D8"]);
const selectedSeats = new Set();
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
  const directKey = `${normalizedFrom}|${normalizedTo}`;
  const reverseKey = `${normalizedTo}|${normalizedFrom}`;

  if (routeFares[directKey]) return routeFares[directKey];
  if (routeFares[reverseKey]) return routeFares[reverseKey];

  return 0;
}

function getEstimatedFare(from, to, passengerValue, tripValue = "oneway") {
  const passengerCount = parsePassengerCount(passengerValue);
  const routeFare = getRouteFare(from, to);
  const tripLegs = tripValue === "roundtrip" ? 2 : 1;
  const passengerFare = routeFare ? routeFare * tripLegs : 0;
  const totalFare = passengerFare * passengerCount;

  return {
    passengerCount,
    routeFare,
    tripLegs,
    passengerFare,
    totalFare,
    formattedFare: routeFare ? formatKsh(routeFare) : "Contact for quote",
    formattedPassengerFare: routeFare ? formatKsh(passengerFare) : "Contact for quote",
    formattedTotalFare: routeFare ? formatKsh(totalFare) : "Contact for quote"
  };
}

function updateFareEstimate() {
  if (!fromSelect || !toSelect || !fareEstimateTotal || !fareEstimateBreakdown) return;
  if (!toSelect.value) {
    fareEstimateTotal.textContent = "Choose a destination";
    fareEstimateBreakdown.textContent = "Fare estimate updates with your trip type and passenger count.";
    return;
  }

  const passengerValue = passengerSelect?.value || "1 passenger";
  const tripValue = tripControl?.value || "roundtrip";
  const estimate = getEstimatedFare(fromSelect.value, toSelect.value, passengerValue, tripValue);
  if (!estimate.routeFare) {
    fareEstimateTotal.textContent = "Contact for quote";
    fareEstimateBreakdown.textContent = "This route's fare is confirmed by iFly reservations.";
    return;
  }

  const tripDescription = estimate.tripLegs === 2 ? "round trip" : "one way";
  fareEstimateTotal.textContent = `${estimate.formattedTotalFare} total`;
  fareEstimateBreakdown.textContent = `${estimate.formattedPassengerFare} per person, ${tripDescription} × ${estimate.passengerCount} ${estimate.passengerCount === 1 ? "passenger" : "passengers"}`;
}

function renderSeatMap() {
  if (!seatGrid) return;

  seatGrid.replaceChildren();
  const corner = document.createElement("span");
  corner.className = "seat-grid-corner";
  corner.setAttribute("aria-hidden", "true");
  seatGrid.append(corner);

  seatColumns.forEach((column) => {
    const heading = document.createElement("span");
    heading.className = "seat-column-heading";
    heading.textContent = column;
    seatGrid.append(heading);
  });

  for (let row = 1; row <= 8; row += 1) {
    const rowHeading = document.createElement("span");
    rowHeading.className = "seat-row-heading";
    rowHeading.textContent = String(row);
    seatGrid.append(rowHeading);

    seatColumns.forEach((column) => {
      const seatNumber = `${column}${row}`;
      const button = document.createElement("button");
      const isReserved = reservedSeats.has(seatNumber);
      button.type = "button";
      button.className = "seat-button";
      button.innerHTML = '<svg class="seat-person" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="6" r="3.2"></circle><path d="M5.5 20v-2.2a6.5 6.5 0 0 1 13 0V20"></path></svg><span></span>';
      button.querySelector("span").textContent = seatNumber;
      button.dataset.seat = seatNumber;
      button.disabled = isReserved;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", isReserved ? `Seat ${seatNumber}, reserved` : `Seat ${seatNumber}, available`);
      if (isReserved) button.classList.add("reserved");
      button.addEventListener("click", () => toggleSeat(seatNumber));
      seatGrid.append(button);
    });
  }
}

function updateSeatSelection() {
  if (!seatGrid || !passengerSelect) return;

  const passengerCount = parsePassengerCount(passengerSelect.value);
  if (selectedSeats.size > passengerCount) {
    const selectedInOrder = [...seatGrid.querySelectorAll(".seat-button.selected")].map((seat) => seat.dataset.seat);
    selectedInOrder.slice(passengerCount).forEach((seat) => selectedSeats.delete(seat));
  }

  seatGrid.querySelectorAll(".seat-button").forEach((button) => {
    const isSelected = selectedSeats.has(button.dataset.seat);
    const isReserved = reservedSeats.has(button.dataset.seat);
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
    button.setAttribute("aria-label", `Seat ${button.dataset.seat}, ${isReserved ? "reserved" : isSelected ? "selected" : "available"}`);
  });

  if (seatSelectionHint) {
    seatSelectionHint.textContent = `Select ${passengerCount} ${passengerCount === 1 ? "seat" : "seats"} for your passengers.`;
  }
  if (seatSelectionStatus) {
    const selected = [...selectedSeats].join(", ");
    seatSelectionStatus.textContent = selectedSeats.size === passengerCount
      ? `Selected seats: ${selected}`
      : `${selectedSeats.size} of ${passengerCount} ${passengerCount === 1 ? "seat" : "seats"} selected.`;
  }
}

function toggleSeat(seatNumber) {
  if (!passengerSelect || !seatGrid) return;
  const passengerCount = parsePassengerCount(passengerSelect.value);

  if (selectedSeats.has(seatNumber)) {
    selectedSeats.delete(seatNumber);
  } else if (selectedSeats.size < passengerCount) {
    selectedSeats.add(seatNumber);
  } else {
    if (seatSelectionStatus) {
      seatSelectionStatus.textContent = `You can select ${passengerCount} ${passengerCount === 1 ? "seat" : "seats"} for this booking.`;
    }
    return;
  }
  updateSeatSelection();
}

if (departureInput) departureInput.min = localDate;
if (returnInput) returnInput.min = localDate;
renderSeatMap();
updateSeatSelection();
passengerSelect?.addEventListener("change", updateSeatSelection);
passengerSelect?.addEventListener("change", updateFareEstimate);
fromSelect?.addEventListener("change", updateFareEstimate);
toSelect?.addEventListener("change", updateFareEstimate);

function updateTripType() {
  if (!tripControl || !returnField || !returnInput) return;
  const oneWay = tripControl.value === "oneway";
  returnField.hidden = oneWay;
  returnInput.required = !oneWay;
}

if (tripControl) {
  tripControl.addEventListener("change", () => {
    updateTripType();
    updateFareEstimate();
  });
}

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
  updateFareEstimate();
});

flightForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!fromSelect || !toSelect) return;
  if (bookingMessage) bookingMessage.textContent = "";
  if (fromSelect.value === toSelect.value) {
    if (bookingMessage) bookingMessage.textContent = "Choose two different cities to find a flight.";
    toSelect.focus();
    return;
  }

  const tripValue = tripControl ? tripControl.value : "roundtrip";
  const departValue = departureInput ? departureInput.value || "TBD" : "TBD";
  const passengerValue = passengerSelect?.value || "1 passenger";
  const passengerCount = parsePassengerCount(passengerValue);
  if (selectedSeats.size !== passengerCount) {
    if (bookingMessage) bookingMessage.textContent = `Please select exactly ${passengerCount} ${passengerCount === 1 ? "seat" : "seats"} before continuing.`;
    seatGrid?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const estimatedFare = getEstimatedFare(fromSelect.value, toSelect.value, passengerValue, tripValue);

  const params = new URLSearchParams({
    from: fromSelect.value,
    to: toSelect.value,
    trip: tripValue,
    depart: departValue,
    passengers: passengerValue,
    seats: [...selectedSeats].join(","),
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
updateFareEstimate();

const bookingDetailForm = document.querySelector("#booking-details-form");
if (bookingDetailForm) {
  const summaryRoute = document.querySelector("#summary-route");
  const summaryDepart = document.querySelector("#summary-depart");
  const summaryPassengers = document.querySelector("#summary-passengers");
  const summarySeats = document.querySelector("#summary-seats");
  const params = new URLSearchParams(window.location.search);

  const from = params.get("from") || "Nairobi";
  const to = params.get("to") || "Mombasa";
  const trip = params.get("trip") || "roundtrip";
  const depart = params.get("depart") || "TBD";
  const passengers = params.get("passengers") || "1 passenger";
  const seats = (params.get("seats") || "").split(",").filter(Boolean);
  const passengerCount = parsePassengerCount(passengers);
  const fareValue = Number(params.get("fare") || 0);
  const fareEstimate = getEstimatedFare(from, to, passengers, trip);
  const finalFare = fareValue > 0 ? fareValue : fareEstimate.totalFare;

  const summaryFare = document.querySelector("#summary-fare");
  const bookingValidationMessage = document.querySelector("#booking-validation-message");

  if (summaryRoute) summaryRoute.textContent = `${normalizeCityName(from)} → ${normalizeCityName(to)}`;
  if (summaryDepart) summaryDepart.textContent = trip === "oneway" ? `${depart} (one-way)` : `${depart}`;
  if (summaryPassengers) summaryPassengers.textContent = passengers;
  if (summarySeats) summarySeats.textContent = seats.join(", ") || "Not selected";
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
    if (seats.length !== passengerCount) {
      if (bookingValidationMessage) {
        bookingValidationMessage.textContent = `This booking needs ${passengerCount} selected ${passengerCount === 1 ? "seat" : "seats"}. Please return to flight search and select the correct number of seats.`;
        bookingValidationMessage.focus();
      }
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
      `Selected seats (subject to confirmation): ${seats.join(", ")}`,
      totalFareText,
      notes ? `Notes: ${notes}` : "",
    ].filter(Boolean).join("\n");

    const url = `https://wa.me/254736989645?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}