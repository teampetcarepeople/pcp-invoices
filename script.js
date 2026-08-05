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

    const params = new URLSearchParams(window.location.search);

    const bookingId = params.get("id");

    if (!bookingId) {

        console.error("Missing booking id.");

        return;

    }

    const response = await fetch(
        `${workerUrl}/?id=${bookingId}`
    );

    const data = await response.json();

    console.log(data);

    const booking = data.booking.fields;
    const client = data.client.fields;

    const pets = data.pets
        .map(p => p.fields["Pet Name"])
        .join(", ");

    // ---------- Replace placeholders ----------

    document.body.innerHTML = document.body.innerHTML

        .replaceAll("{{Client Name}}", client["Full Name"] || "")

        .replaceAll("{{Phone}}", client["Phone"] || "")

        .replaceAll(
            "{{Address}}",
            [
                client["Address Line 2"],
                client["Address Line 1"]
            ]
            .filter(Boolean)
            .join("<br>")
        )

        .replaceAll("{{Pets}}", pets)

        .replaceAll(
            "{{Invoice Number}}",
            booking["Invoice Number"] || ""
        )
.replaceAll(
    "{{Invoice Date}}",
    formatDate()
)


        .replaceAll(
            "{{Booking Line Total}}",
            formatCurrency(booking["Booking Line Total"])?? ""
        )

        .replaceAll(
            "{{Additional Charges}}",
            formatCurrency(booking["Additional Charge"]) ?? "-"
        )

        .replaceAll(
            "{{Additional Charge Notes}}",
            booking["Additional Charge Notes"] ?? ""
        )

        .replaceAll(
            "{{Manual Discount}}",
            formatCurrency(booking["Manual Discount"])?? "-"
        )

        .replaceAll(
    "{{Total}}",
    formatCurrency(booking["Total"]) ?? ""
);

    // ---------- Build Services Table ----------

const tbody = document.querySelector("#services-body");

if (!tbody) return;

tbody.innerHTML = "";

data.services.forEach(item => {

    const service = item.service.fields;
    const bookingLine = item.booking.fields;

    const row = document.createElement("tr");

    const serviceName = service["Service Name"];

    const basePrice = formatCurrency(
        bookingLine["Service Base Price"]?.[0]
    );

    const units = bookingLine["Number of Days"];

    const nightCharge = bookingLine["Night Charge Display"];

    const total = formatCurrency(
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

loadInvoice();
document
.getElementById("download-btn")
.addEventListener("click",()=>{

    window.print();

});
