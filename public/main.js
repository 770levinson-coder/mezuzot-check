let qty = 1;
const MAX_QTY = 10;
const MIN_QTY = 1;
let selectedSlot = null;

const qtyDisplay   = document.getElementById("qty-display");
const durationNote = document.getElementById("duration-note");
const slotGrid     = document.getElementById("slot-grid");
const btnSubmit    = document.getElementById("btn-submit");
const errorMsg     = document.getElementById("error-msg");

document.getElementById("qty-minus").addEventListener("click", () => {
  if (qty > MIN_QTY) { qty--; onQtyChange(); }
});
document.getElementById("qty-plus").addEventListener("click", () => {
  if (qty < MAX_QTY) { qty++; onQtyChange(); }
});

function onQtyChange() {
  qtyDisplay.textContent = qty;
  const mins = qty * 4;
  durationNote.textContent = "משך הבדיקה: ~" + mins + " דקות";
  selectedSlot = null;
  updateSubmitBtn();
  loadSlots();
}

async function loadSlots() {
  slotGrid.innerHTML = '<span class="slot-loading">טוען שעות...</span>';
  try {
    const res  = await fetch("/api/slots?qty=" + qty);
    const data = await res.json();
    renderSlots(data.slots || []);
  } catch {
    slotGrid.innerHTML = '<span class="no-slots">שגיאה בטעינת שעות</span>';
  }
}

function renderSlots(slots) {
  if (slots.length === 0) {
    slotGrid.innerHTML = '<span class="no-slots">אין שעות פנויות לכמות זו</span>';
    return;
  }
  slotGrid.innerHTML = slots.map(s =>
    '<button class="slot-btn" onclick="selectSlot(\'' + s + '\')">' + s + '</button>'
  ).join("");
}

function selectSlot(s) {
  selectedSlot = s;
  document.querySelectorAll(".slot-btn").forEach(b => {
    b.classList.toggle("selected", b.textContent.trim() === s);
  });
  updateSubmitBtn();
}

function updateSubmitBtn() {
  btnSubmit.disabled = !selectedSlot;
}

btnSubmit.addEventListener("click", async () => {
  errorMsg.textContent = "";
  const name  = document.getElementById("inp-name").value.trim();
  const phone = document.getElementById("inp-phone").value.trim();
  const email = document.getElementById("inp-email").value.trim();

  if (!name)  { errorMsg.textContent = "נא להזין שם"; return; }
  if (!phone) { errorMsg.textContent = "נא להזין טלפון"; return; }

  btnSubmit.disabled = true;
  btnSubmit.textContent = "שולח...";

  try {
    const res  = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, phone, email, qty, startTime: selectedSlot }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || "שגיאה";
      btnSubmit.disabled = false;
      btnSubmit.textContent = "שלח רישום";
      loadSlots();
      selectedSlot = null;
      return;
    }

    const a = data.appt;
    document.getElementById("form-card").style.display = "none";
    document.getElementById("success-screen").style.display = "block";
    document.getElementById("appt-summary").innerHTML =
      "<strong>שם:</strong> " + a.name + "<br>" +
      "<strong>שעה:</strong> " + a.startTime + " – " + a.endTime + "<br>" +
      "<strong>מזוזות:</strong> " + a.qty + "<br>" +
      "<strong>מחיר לתשלום במקום:</strong> " + a.price + " ₪";
  } catch {
    errorMsg.textContent = "שגיאת רשת";
    btnSubmit.disabled = false;
    btnSubmit.textContent = "שלח רישום";
  }
});

loadSlots();
