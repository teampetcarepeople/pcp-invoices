const workerUrl =
    "https://pcp-invoice-api.team-petcarepeople.workers.dev";

function formatCurrency(value) {

    if (value === null || value === undefined || value === "") {
        return "-";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value);

}

function formatDate(dateString) {

    const date = dateString
        ? new Date(dateString)
        : new Date();

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

async function loadInvoice() {

    const bookingId =
        new URLSearchParams(window.location.search).get("id");

    if (!bookingId) {

        alert("Booking ID missing.");

        return;

    }

    const response = await fetch(
        `${workerUrl}/?id=${encodeURIComponent(bookingId)}`
    );

    const data = await response.json();

    console.log("Invoice Data:", data);

    const booking = data.booking.fields;
    const client = data.client.fields;

    const pets = data.pets
        .map(p => p.fields["Pet Name"])
        .join(", ");

    // -------------------------
    // Populate Invoice
    // -------------------------

    console.log("invoice-number", document.getElementById("invoice-number"));
console.log("invoice-date", document.getElementById("invoice-date"));
console.log("client-name", document.getElementById("client-name"));
console.log("pets", document.getElementById("pets"));
console.log("phone", document.getElementById("phone"));
console.log("address", document.getElementById("address"));
        .filter(Boolean)
        .join("<br>");

    document.getElementById("booking-line-total").textContent =
        formatCurrency(booking["Booking Line Total"]);

    document.getElementById("additional-charges").textContent =
        formatCurrency(booking["Additional Charge"]);

    document.getElementById("additional-charge-notes").textContent =
        booking["Additional Charge Notes"] || "";

    document.getElementById("manual-discount").textContent =
        formatCurrency(booking["Manual Discount"]);

    document.getElementById("grand-total").textContent =
        formatCurrency(booking["Total"]);

    // -------------------------
    // Hide Empty Rows
    // -------------------------

    if (!booking["Additional Charge"]) {

        document.getElementById("additional-charge-row").style.display = "none";
        document.getElementById("charge-note-row").style.display = "none";

    }

    if (!booking["Manual Discount"]) {

        document.getElementById("discount-row").style.display = "none";

    }

}
loadInvoice();

document
    .getElementById("download-btn")
    .addEventListener("click", () => {

        window.print();

    });
