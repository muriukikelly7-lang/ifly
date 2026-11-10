const flightForm = document.querySelector("#flight-search");
const tripControl = document.querySelector('select[name="trip"]');
const returnField = document.querySelector(".return-field");
const returnInput = document.querySelector('input[name="return"]');
const departureInput = document.querySelector('input[name="depart"]');
const departureTimeSelect = document.querySelector('select[name="departTime"]');
const fromSelect = document.querySelector('select[name="from"]');
const toSelect = document.querySelector('select[name="to"]');
const bookingMessage = document.querySelector("#booking-message");
const passengerInput = document.querySelector('input[name="passengers"]');
const fareEstimateTotal = document.querySelector("#fare-estimate-total");
const fareEstimateBreakdown = document.querySelector("#fare-estimate-breakdown");
const seatGrid = document.querySelector("#seat-grid");
const seatSelectionHint = document.querySelector("#seat-selection-hint");
const seatSelectionStatus = document.querySelector("#seat-selection-status");
const seatSelectionDialog = document.querySelector("#seat-selection-dialog");
const seatSelectionConfirm = document.querySelector("#seat-selection-confirm");
const seatSelectionBack = document.querySelector("#seat-selection-back");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const toast = document.querySelector("#toast");

const routeFares = {
  "Nairobi|Mombasa": 6000,
  "Nairobi|Lamu": 6500,
  "Nairobi|Garissa": 5500,
  "Nairobi|Lodwar": 8500,
  "Nairobi|Wajir": 5000,
  "Nairobi|Mandera": 13200,
  "Nairobi|Juba": 15000,
  "Nairobi|Mogadishu": 20000
};

const seatColumns = ["A", "B", "C", "D"];
const reservedSeats = new Set(["A1", "B2", "C3", "C5", "B6", "A7", "D8"]);
const selectedSeats = new Set();
let renderedSeatRowCount = 0;
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function normalizeCityName(city) {
  if (!city) return "";
  return city.replace(/\s*\([^)]*\)/g, "").trim();
}

function parsePassengerCount(passengerValue) {
  const match = String(passengerValue || "").match(/^\s*(\d+)/);
  const passengerCount = match ? Number(match[1]) : 0;
  return Number.isSafeInteger(passengerCount) && passengerCount > 0 ? passengerCount : 0;
}

function formatKsh(amount) {
  return `KSH ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(amount)}`;
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

function renderPublishedRouteFares() {
  document.querySelectorAll("[data-route-destination]").forEach((element) => {
    const fare = getRouteFare("Nairobi", element.dataset.routeDestination);
    if (!fare) return;

    const prefix = element.dataset.farePrefix;
    element.textContent = `${prefix ? `${prefix} ` : ""}KSH ${new Intl.NumberFormat("en-KE").format(fare)}`;
  });
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
    totalFare,
    formattedFare: routeFare ? formatKsh(routeFare) : "Contact for quote",
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

  if (!passengerInput?.validity.valid) {
    fareEstimateTotal.textContent = "Enter passenger count";
    fareEstimateBreakdown.textContent = "Enter a whole number of passengers greater than zero.";
    return;
  }

  const passengerValue = passengerInput.value;
  const tripValue = tripControl?.value || "roundtrip";
  const estimate = getEstimatedFare(fromSelect.value, toSelect.value, passengerValue, tripValue);
  if (!estimate.routeFare) {
    fareEstimateTotal.textContent = "Contact for quote";
    fareEstimateBreakdown.textContent = "This route's fare is confirmed by iFly reservations.";
    return;
  }

  const tripDescription = estimate.tripLegs === 2 ? "round trip" : "one way";
  fareEstimateTotal.textContent = `${estimate.formattedTotalFare} total`;
  fareEstimateBreakdown.textContent = `${estimate.formattedFare} per flight × ${estimate.tripLegs} ${estimate.tripLegs === 1 ? "flight" : "flights"} × ${estimate.passengerCount} ${estimate.passengerCount === 1 ? "passenger" : "passengers"} (${tripDescription})`;
}

function getSeatRowCount(passengerCount) {
  return Math.max(8, Math.ceil((passengerCount + reservedSeats.size) / seatColumns.length));
}

function renderSeatMap(passengerCount = parsePassengerCount(passengerInput?.value)) {
  if (!seatGrid) return;

  const rowCount = getSeatRowCount(passengerCount);
  seatGrid.replaceChildren();
  renderedSeatRowCount = rowCount;
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

  for (let row = 1; row <= rowCount; row += 1) {
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
  if (!seatGrid || !passengerInput) return;

  if (!passengerInput.validity.valid) {
    if (seatSelectionStatus) seatSelectionStatus.textContent = "Enter a valid number of passengers.";
    return;
  }
  const passengerCount = parsePassengerCount(passengerInput.value);
  if (!passengerCount) {
    if (seatSelectionStatus) seatSelectionStatus.textContent = "Enter a valid number of passengers.";
    return;
  }
  if (selectedSeats.size > passengerCount) {
    [...selectedSeats].slice(passengerCount).forEach((seat) => selectedSeats.delete(seat));
  }
  if (renderedSeatRowCount !== getSeatRowCount(passengerCount)) renderSeatMap(passengerCount);

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
  if (!passengerInput || !seatGrid) return;
  const passengerCount = parsePassengerCount(passengerInput.value);
  if (!passengerCount) return;

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
passengerInput?.addEventListener("input", () => {
  updateSeatSelection();
  updateFareEstimate();
});
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
  if (!seatSelectionDialog || typeof seatSelectionDialog.showModal !== "function") {
    if (bookingMessage) bookingMessage.textContent = "Seat selection is unavailable. Please refresh the page and try again.";
    return;
  }

  updateSeatSelection();
  seatSelectionDialog.showModal();
});

seatSelectionBack?.addEventListener("click", () => {
  seatSelectionDialog?.close();
});

seatSelectionConfirm?.addEventListener("click", () => {
  if (!fromSelect || !toSelect) return;
  const tripValue = tripControl ? tripControl.value : "roundtrip";
  const departValue = departureInput ? departureInput.value || "TBD" : "TBD";
  const passengerCount = parsePassengerCount(passengerInput?.value);
  if (!passengerCount) return;
  const passengerValue = `${passengerCount} ${passengerCount === 1 ? "passenger" : "passengers"}`;
  if (selectedSeats.size !== passengerCount) {
    if (seatSelectionStatus) {
      seatSelectionStatus.textContent = `Please select exactly ${passengerCount} ${passengerCount === 1 ? "seat" : "seats"} before continuing.`;
    }
    seatGrid?.querySelector(".seat-button:not(:disabled)")?.focus();
    return;
  }

  const params = new URLSearchParams({
    from: fromSelect.value,
    to: toSelect.value,
    trip: tripValue,
    depart: departValue,
    departTime: departureTimeSelect?.value || "",
    passengers: passengerValue,
    seats: [...selectedSeats].join(",")
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
renderPublishedRouteFares();
updateFareEstimate();

const bookingDetailForm = document.querySelector("#booking-details-form");
if (bookingDetailForm) {
  const summaryRoute = document.querySelector("#summary-route");
  const summaryDepart = document.querySelector("#summary-depart");
  const summaryDepartTime = document.querySelector("#summary-depart-time");
  const summaryPassengers = document.querySelector("#summary-passengers");
  const summarySeats = document.querySelector("#summary-seats");
  const params = new URLSearchParams(window.location.search);

  const from = params.get("from") || "Nairobi";
  const to = params.get("to") || "Mombasa";
  const trip = params.get("trip") || "roundtrip";
  const depart = params.get("depart") || "TBD";
  const departTime = params.get("departTime") || "";
  const departSession = departTime === "08:00" ? "Morning" : departTime === "17:00" ? "Evening" : "";
  const passengers = params.get("passengers") || "1 passenger";
  const seats = (params.get("seats") || "").split(",").filter(Boolean);
  const passengerCount = parsePassengerCount(passengers);
  const fareEstimate = getEstimatedFare(from, to, passengers, trip);
  const finalFare = fareEstimate.totalFare;

  const summaryFare = document.querySelector("#summary-fare");
  const bookingValidationMessage = document.querySelector("#booking-validation-message");

  if (summaryRoute) summaryRoute.textContent = `${normalizeCityName(from)} → ${normalizeCityName(to)}`;
  if (summaryDepart) summaryDepart.textContent = trip === "oneway" ? `${depart} (one-way)` : `${depart}`;
  if (summaryDepartTime) summaryDepartTime.textContent = departSession ? `${departTime} ${departSession} (requested)` : "To be selected";
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
    const passengerType = formData.get("passengerType")?.toString();
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

    const whatsappMessage = [
      "Hello iFly Air,",
      "",
      "I would like to confirm my booking:",
      `Route: ${normalizeCityName(from)} → ${normalizeCityName(to)}`,
      `Depart: ${depart} at ${departTime ? `${departTime}${departSession ? ` — ${departSession}` : ""} (requested; subject to airline confirmation)` : "a time to be confirmed"}`,
      `Fare per passenger per journey: ${fareEstimate.routeFare > 0 ? `Ksh. ${new Intl.NumberFormat("en-KE").format(fareEstimate.routeFare)}` : "To be confirmed"}`,
      `Journeys: ${fareEstimate.tripLegs}`,
      `Passengers: ${passengers}`,
      `Total: ${finalFare > 0 ? `Ksh. ${new Intl.NumberFormat("en-KE").format(finalFare)}` : "To be confirmed"}`,
      `Seats: ${seats.join(", ")}`,
      "Flight: To be confirmed by reservations",
      "",
      "Passenger details:",
      `Name: ${fullName}`,
      `ID/Passport: ${idNumber}`,
      `Passenger type: ${passengerType || "Adult"}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Special requests: ${notes || "None"}`,
      "",
      "Please help me complete this booking."
    ].join("\n");

    const url = `https://wa.me/254736989645?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}