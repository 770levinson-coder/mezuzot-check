let qty = 1;
const MAX_QTY = 10;
const MIN_QTY = 1;
let selectedSlot = null;
let delivery = false;

const qtyDisplay = document.getElementById("qty-display");
const slotGrid   = document.getElementById("slot-grid");
const btnSubmit  = document.getElementById("btn-submit");
const errorMsg   = document.getElementById("error-msg");

document.getElementById("qty-minus").addEventListener("click", () => {
  if (qty > MIN_QTY) { qty--; onQtyChange(); }
});
document.getElementById("qty-plus").addEventListener("click", () => {
  if (qty < MAX_QTY) { qty++; onQtyChange(); }
});

function onQtyChange() {
  qtyDisplay.textContent = qty;
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
  slotGrid.innerHTML =
    '<button type="button" class="slot-trigger" id="slot-trigger" onclick="toggleSlotList()">לחץ לבחירת שעה ▼</button>' +
    '<div class="slot-dropdown" id="slot-dropdown">' +
    slots.map(s => '<button type="button" class="slot-btn" onclick="selectSlot(\'' + s + '\')">' + s + '</button>').join('') +
    '</div>';
}

function toggleSlotList() {
  const dd = document.getElementById('slot-dropdown');
  if (dd) dd.classList.toggle('open');
}

function selectSlot(s) {
  selectedSlot = s;
  const trigger = document.getElementById('slot-trigger');
  if (trigger) trigger.textContent = 'שעה נבחרה: ' + s + ' ✓';
  const dd = document.getElementById('slot-dropdown');
  if (dd) dd.classList.remove('open');
  document.querySelectorAll(".slot-btn").forEach(b => {
    b.classList.toggle("selected", b.textContent.trim() === s);
  });
  updateSubmitBtn();
}

function setDeliveryMode(isDelivery) {
  delivery = isDelivery;
  const slotWrap = document.getElementById('slot-wrap');
  if (slotWrap) slotWrap.style.display = isDelivery ? 'none' : 'block';
  document.getElementById('address-group').style.display = isDelivery ? 'block' : 'none';
  if (!isDelivery) { selectedSlot = null; loadSlots(); }
  updateSubmitBtn();
}

function updateSubmitBtn() {
  btnSubmit.disabled = delivery ? false : !selectedSlot;
}


btnSubmit.addEventListener("click", async () => {
  errorMsg.textContent = "";
  const name    = document.getElementById("inp-name").value.trim();
  const phone   = document.getElementById("inp-phone").value.trim();
  const email   = document.getElementById("inp-email").value.trim();
    const address = delivery ? document.getElementById("inp-address").value.trim() : "";

  if (!name)  { errorMsg.textContent = "נא להזין שם"; return; }
  if (!phone) { errorMsg.textContent = "נא להזין טלפון"; return; }
  if (!email) { errorMsg.textContent = "נא להזין אימייל"; return; }
  if (!delivery && !selectedSlot) { errorMsg.textContent = "נא לבחור שעה"; return; }
  if (delivery && !address) { errorMsg.textContent = "נא להזין כתובת למשלוח"; return; }

  btnSubmit.disabled = true;
  btnSubmit.textContent = "שולח...";

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, qty, startTime: selectedSlot, delivery, address, notes: (document.getElementById('inp-notes')?.value||'').trim() }),
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
    let summary =
      "<strong>שם:</strong> " + a.name + "<br>" +
      "<strong>שעה:</strong> " + a.startTime + "<br>" +
      "<strong>מזוזות:</strong> " + a.qty + "<br>" +
      (a.delivery ? "<strong>שירות הגעה לבית:</strong> 30 ₪<br>" : "") +
      "<strong>סה\"כ לתשלום:</strong> " + a.price + " ₪";
    if (a.delivery) summary += "<br><strong>משלוח לכתובת:</strong> " + a.address;
    document.getElementById("appt-summary").innerHTML = summary;
  } catch {
    errorMsg.textContent = "שגיאת רשת";
    btnSubmit.disabled = false;
    btnSubmit.textContent = "שלח רישום";
  }
});

loadSlots();
