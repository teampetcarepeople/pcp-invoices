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
    const date = dateString ? new Date(dateString) : new Date();

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
            throw new Error("Missing booking ID.");
        }

        const response = await fetch(`${workerUrl}/?id=${encodeURIComponent(bookingId)}`);

        if (!response.ok) {
            throw new Error("Unable to load invoice.");
        }

        const data = await response.json();
        console.log(data);

        const booking = data.booking.fields;
        const client = data.client.fields;
        const pets = data.pets.map(p => p.fields["Pet Name"]).join(", ");

        // -------------------------
        // Populate Invoice Details
        // -------------------------
        const setElementText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text ?? "-";
        };

        setElementText("invoice-number", booking["Invoice Number"]);
        setElementText("invoice-date", formatDate(booking["Invoice Date"]));
        setElementText("client-name", client["Full Name"]);
        setElementText("pets", pets);
        setElementText("phone", client["Phone Number"]);
        setElementText("address", client["Address"]);

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

        // -------------------------
        // Build Services Table
        // -------------------------
        const tbody = document.getElementById("services-body");
        if (tbody) {
            tbody.innerHTML = "";

            data.services.forEach(item => {
                const service = item.service.fields;
                const bookingLine = item.booking.fields;

                const row = document.createElement("tr");

                const serviceName = service["Service Name"] || "";
                const basePrice = formatCurrency(service["Base Price"]);
                const units = bookingLine["Number of Days"] ?? "-";
                const nightCharge = bookingLine["Night Charge Display"] || "-";
                const total = formatCurrency(bookingLine["Line Subtotal"]);

                row.innerHTML = `
                    <td>${serviceName}</td>
                    <td>${basePrice}</td>
                    <td>${units}</td>
                    <td>${nightCharge}</td>
                    <td class="amount">${total}</td>
                `;

                tbody.appendChild(row);
            });
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

loadInvoice();

const downloadBtn = document.getElementById("download-btn");
if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        window.print();
    });
}
