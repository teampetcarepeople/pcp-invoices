catch (err) {

    console.error(err);

    alert(err.stack);

}
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

    try {

        const bookingId =
            new URLSearchParams(window.location.search).get("id");

        if (!bookingId) {

            throw new Error("Missing booking ID.");

        }

        const response = await fetch(

            `${workerUrl}/?id=${encodeURIComponent(bookingId)}`

        );

        if (!response.ok) {

            throw new Error("Unable to load invoice.");

        }

        const data = await response.json();

        console.log(data);

        const booking = data.booking.fields;
        const client = data.client.fields;

        const pets = data.pets
            .map(p => p.fields["Pet Name"])
            .join(", ");

        // -------------------------
        // Populate Invoice
        // -------------------------

        document.getElementById("invoice-number").textContent =
            booking["Invoice Number"] || "";

        document.getElementById("invoice-date").textContent =
            formatDate();

        document.getElementById("client-name").textContent =
            client["Full Name"] || "";

        document.getElementById("pets").textContent =
            pets;

        document.getElementById("phone").textContent =
            client["Phone"] || "";

        document.getElementById("address").innerHTML =
            [
                client["Address Line 2"],
                client["Address Line 1"]
            ]
            .filter(Boolean)
            .join("<br>");

        document.getElementById("booking-line-total").textContent =
            formatCurrency(
                booking["Booking Line Total"]
            );

        document.getElementById("additional-charges").textContent =
            formatCurrency(
                booking["Additional Charge"]
            );

        document.getElementById("additional-charge-notes").textContent =
            booking["Additional Charge Notes"] || "";

        document.getElementById("manual-discount").textContent =
            formatCurrency(
                booking["Manual Discount"]
            );

        document.getElementById("grand-total").textContent =
            formatCurrency(
                booking["Total"]
            );

        // -------------------------
        // Hide Empty Rows
        // -------------------------

        if (!booking["Additional Charge"]) {

            document.getElementById("additional-charge-row").style.display =
                "none";

            document.getElementById("charge-note-row").style.display =
                "none";

        }

        if (!booking["Manual Discount"]) {

            document.getElementById("discount-row").style.display =
                "none";

        }
        // -------------------------
        // Build Services Table
        // -------------------------

        const tbody = document.getElementById("services-body");

        tbody.innerHTML = "";

        data.services.forEach(item => {

            const service = item.service.fields;
            const bookingLine = item.booking.fields;

            const row = document.createElement("tr");

            const serviceName =
                service["Service Name"] || "";

            const basePrice =
                formatCurrency(
                    service["Base Price"]
                );

            const units =
                bookingLine["Number of Days"] ?? "-";

            const nightCharge =
                bookingLine["Night Charge Display"] || "-";

            const total =
                formatCurrency(
                    bookingLine["Line Subtotal"]
                );

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

    catch (err) {

        console.error(err);

        alert(err.message);

    }

}

loadInvoice();

document
    .getElementById("download-btn")
    .addEventListener("click", () => {

        window.print();

    });
