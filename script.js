const workerUrl = "https://pcp-invoice-api.team-petcarepeople.workers.dev";

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
    // If no dateString is passed, default to today's date
    const date = dateString ? new Date(Array.isArray(dateString) ? dateString[0] : dateString) : new Date();

    if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

async function loadInvoice() {
    try {
        const bookingId = new URLSearchParams(window.location.search).get("id");

        if (!bookingId) {
            throw new Error("Missing booking ID in URL parameters.");
        }

        const response = await fetch(`${workerUrl}/?id=${encodeURIComponent(bookingId)}`);

        if (!response.ok) {
            throw new Error("Unable to load invoice data from worker.");
        }

        const data = await response.json();
        console.log("Full API Response:", data);

        const booking = data.booking?.fields || {};
        const client = data.client?.fields || {};
        
        const pets = Array.isArray(data.pets)
            ? data.pets
                .map(p => p.fields?.["Pet Name"] || p.fields?.["Name"] || p.fields?.["Display Name"] || "")
                .filter(Boolean)
                .join(", ")
            : "-";

        const setElementText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = (text !== null && text !== undefined && text !== "") ? text : "-";
        };

        // -------------------------
        // Populate Invoice Details
        // -------------------------
        setElementText("invoice-number", booking["Invoice Number"] || booking["Name"]);
        
        // Sets today's date on the invoice
setElementText("invoice-date", formatDate());
        
        setElementText("client-name", client["Full Name"] || client["Display Name"]);
        setElementText("pets", pets);

        // Phone
        setElementText("phone", client["Phone"]);

        // Address
        const address1 = client["Address Line 1"] || "";
        const address2 = client["Address Line 2"] || "";
        const fullAddress = [address1, address2].filter(Boolean).join(", ");
        setElementText("address", fullAddress);

        // Totals
        setElementText("booking-line-total", formatCurrency(booking["Booking Line Total"]));
        setElementText("additional-charges", formatCurrency(booking["Additional Charge"]));
        setElementText("additional-charge-notes", booking["Additional Charge Notes"] || "");
        setElementText("manual-discount", formatCurrency(booking["Manual Discount"]));
        setElementText("grand-total", formatCurrency(booking["Total"]));

        // -------------------------
        // Hide Empty Rows
        // -------------------------
        if (!booking["Additional Charge"]) {
            const chargeRow = document.getElementById("additional-charge-row");
            const noteRow = document.getElementById("charge-note-row");
            if (chargeRow) chargeRow.style.display = "none";
            if (noteRow) noteRow.style.display = "none";
        }

        if (!booking["Manual Discount"]) {
            const discountRow = document.getElementById("discount-row");
            if (discountRow) discountRow.style.display = "none";
        }
const nightChargeHeader = document.getElementById("night-charge-header");

const hasNightCharge = Array.isArray(data.services) &&
    data.services.some(item =>
        item.booking?.fields?.["Night Charge Applicable?"] === true
    );

if (nightChargeHeader && !hasNightCharge) {
    nightChargeHeader.style.display = "none";
}
        // -------------------------
               // -------------------------
        // Build Services Table
        // -------------------------
        const tbody = document.getElementById("services-body");

        if (tbody) {
            tbody.innerHTML = "";

            if (Array.isArray(data.services)) {
                data.services.forEach(item => {
                    const service = item.service?.fields || {};
                    const bookingLine = item.booking?.fields || {};

                    const row = document.createElement("tr");

                    // A custom service has a Custom Service Name.
                    const isCustom = Boolean(
                        bookingLine["Custom Service Name"]
                    );

                    // Service name
                    const serviceName = isCustom
                        ? bookingLine["Custom Service Name"]
                        : service["Service Name"] || service["Name"] || "";

                    // Rate
                    const rate = isCustom
                        ? formatCurrency(bookingLine["Custom Rate"])
                        : formatCurrency(service["Base Price"]);

                    // Quantity
                    const units = isCustom
                        ? (bookingLine["Custom Quantity"] ?? "-")
                        : (bookingLine["Number of Days"] ??
                           bookingLine["Units"] ??
                           "-");

                    // Night charge only applies to standard services.
                    const nightCharge = isCustom
                        ? "-"
                        : (bookingLine["Night Charge Display"] || "-");

                    // Calculated line total
                    const total = formatCurrency(
                        bookingLine["Line Subtotal"]
                    );

                    row.innerHTML = `
                        <td>${serviceName}</td>
                        <td>${rate}</td>
                        <td>${units}</td>
                        <td>${nightCharge}</td>
                        <td class="amount">${total}</td>
                    `;

                    tbody.appendChild(row);
                });
            }
        }

    } catch (err) {
        console.error("Invoice Loading Error:", err);
    }
}

loadInvoice();

const downloadBtn = document.getElementById("download-btn");

if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        window.print();
    });
}

