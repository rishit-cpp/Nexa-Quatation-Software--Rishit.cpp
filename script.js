// ── Helpers ──────────────────────────────────────────────
function fmt(n) {
  const num = Number(n) || 0;
  return "₹\u00A0" + num.toLocaleString("en-IN");
}

function generateRef() {
  const d = new Date();
  return "NXA-" + d.getFullYear().toString().slice(-2)
    + String(d.getMonth()+1).padStart(2,'0')
    + String(d.getDate()).padStart(2,'0') + "-"
    + Math.floor(100 + Math.random() * 900);
}

// ── Live Calculation ───────────────────────────────────────
const amts  = document.querySelectorAll(".amt");
const offer  = document.getElementById("offer");
const totalEl = document.getElementById("total");
const grandEl = document.getElementById("grand");

function calculate() {
  let total = 0;
  amts.forEach(i => total += Number(i.value || 0));
  const discount = Number(offer.value || 0);
  totalEl.innerText = fmt(total);
  grandEl.innerText = fmt(total - discount);
}

amts.forEach(i => i.addEventListener("input", calculate));
offer.addEventListener("input", calculate);

// ── Enter key: jump to next field ─────────────────────────
const inputs = document.querySelectorAll("input, select");
inputs.forEach((input, index) => {
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = inputs[index + 1];
      if (next) next.focus();
    }
  });
});

// ── Validation ────────────────────────────────────────────
function validate() {
  const name  = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const veh   = document.getElementById("vehicle").value.trim();
  const ex    = Number(document.getElementById("amt0").value || 0);

  const errEl = document.getElementById("formError");

  if (!name) { showError(errEl, "Please enter the customer name."); return false; }
  if (!phone || phone.replace(/\D/g,'').length < 10) {
    showError(errEl, "Please enter a valid 10-digit phone number."); return false;
  }
  if (!veh)  { showError(errEl, "Please enter the vehicle model."); return false; }
  if (ex <= 0) { showError(errEl, "Ex-Showroom Price must be greater than 0."); return false; }

  errEl.style.display = "none";
  return true;
}

function showError(el, msg) {
  el.innerText = "⚠️  " + msg;
  el.style.display = "block";
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ── Generate Preview ───────────────────────────────────────
function lockAndPreview() {
  if (!validate()) return;

  document.getElementById("formPage").style.display   = "none";
  document.getElementById("previewPage").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  const now = new Date();
  document.getElementById("date").innerText   = now.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  document.getElementById("refNum").innerText = generateRef();

  document.getElementById("pName").innerText    = document.getElementById("customerName").value.trim();
  document.getElementById("pPhone").innerText   = document.getElementById("customerPhone").value.trim();
  document.getElementById("pVehicle").innerText = document.getElementById("vehicle").value.trim();
  document.getElementById("pVariant").innerText = document.getElementById("variant").value || "—";
  document.getElementById("pFuel").innerText    = document.getElementById("fuel").value || "—";
  document.getElementById("pColour").innerText  = document.getElementById("colour").value.trim() || "—";

  const labels = ["Ex-Showroom Price","RTO Charges","Insurance","Accessories","Extended Warranty","TCS"];
  amts.forEach((inp, idx) => {
    const val = Number(inp.value || 0);
    const td  = document.getElementById("p" + idx);
    td.innerText = fmt(val);
    // dim zero-value rows
    td.closest("tr").style.opacity = val === 0 ? "0.4" : "1";
  });

  let total    = 0;
  amts.forEach(i => total += Number(i.value || 0));
  const discount = Number(offer.value || 0);
  const grand    = total - discount;

  document.getElementById("pTotal").innerText = fmt(total);
  document.getElementById("pOffer").innerText = "– " + fmt(discount);
  document.getElementById("pGrand").innerText = fmt(grand);
}

// ── Go Back ───────────────────────────────────────────────
function goBack() {
  document.getElementById("previewPage").style.display = "none";
  document.getElementById("formPage").style.display    = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Download PDF ──────────────────────────────────────────
function downloadPDF() {
  const name = document.getElementById("customerName").value.trim().replace(/\s+/g,"_") || "Customer";
  const veh  = document.getElementById("vehicle").value.trim().replace(/\s+/g,"_") || "Car";
  const btn  = document.querySelector(".btn-pdf");

  btn.innerText = "⏳ Generating...";
  btn.disabled  = true;

  const opt = {
    margin:      [10, 10, 10, 10],
    filename:    `Quotation_${name}_${veh}.pdf`,
    image:       { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(document.getElementById("invoice")).save()
    .then(() => {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Download PDF`;
      btn.disabled = false;
    });
}

// ── Send WhatsApp ─────────────────────────────────────────
function sendWhatsApp() {
  const name     = document.getElementById("customerName").value.trim();
  const phone    = document.getElementById("customerPhone").value.trim().replace(/\D/g,"");
  const veh      = document.getElementById("vehicle").value.trim();
  const variant  = document.getElementById("variant").value || "";
  const fuel     = document.getElementById("fuel").value || "";
  const colour   = document.getElementById("colour").value.trim() || "";
  const date     = document.getElementById("date").innerText;
  const ref      = document.getElementById("refNum").innerText;

  let total = 0;
  amts.forEach(i => total += Number(i.value || 0));
  const discount = Number(offer.value || 0);
  const grand    = total - discount;

  const fmtPlain = n => "Rs " + (Number(n)||0).toLocaleString("en-IN");

  const lines = [
    `🚗 *CAR QUOTATION – NEXA VAISHALI NAGAR, AJMER*`,
    ``,
    `Hello ${name} 👋,`,
    `Thank you for visiting Nexa. Here is your quotation:`,
    ``,
    `📋 *Ref:* ${ref}  |  *Date:* ${date}`,
    ``,
    `*Vehicle Details*`,
    `▸ Model   : ${veh}${variant ? " – " + variant : ""}`,
    fuel   ? `▸ Fuel    : ${fuel}` : null,
    colour ? `▸ Colour  : ${colour}` : null,
    ``,
    `*Price Breakdown*`,
  ];

  const priceLabels = ["Ex-Showroom","RTO Charges","Insurance","Accessories","Ext. Warranty","TCS"];
  amts.forEach((inp, idx) => {
    const val = Number(inp.value || 0);
    if (val > 0) lines.push(`▸ ${priceLabels[idx].padEnd(14," ")} : ${fmtPlain(val)}`);
  });

  lines.push(``, `▸ Sub Total      : ${fmtPlain(total)}`);
  if (discount > 0) lines.push(`▸ Discount       : – ${fmtPlain(discount)}`);
  lines.push(``, `💰 *Grand Total  : ${fmtPlain(grand)}*`);
  lines.push(``, `📞 *Relationship Manager: Anurag Mathur*`);
  lines.push(`📱 9929570035 | 9414146940`);
  lines.push(``, `_Prices are subject to change. Valid for 7 days._`);

  const msg = lines.filter(l => l !== null).join("\n");
  const url = phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(url, "_blank");
}
