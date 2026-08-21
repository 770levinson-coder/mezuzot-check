let qty         = 1;
const MAX_QTY   = 10;
const MIN_QTY   = 1;
let selectedSlot = null;

const qtyDisplay   = document.getElementById("qty-display");
const durationNote = document.getElementById("duration-note");
const slotGrid     = document.getElementById("slot-grid");
const btnSubmit    = document.getElementById("btn-submit");
const errorMsg     = document.getElementById("error-msg");

// ââ qty stepper âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
document.getElementById("qty-minus").addEventListener("click", () => {
  if (qty > MIN_QTY) { qty--; onQtyChange(); }
});
document.getElementById("qty-plus").addEventListener("click", () => {
  if (qty < MAX_QTY) { qty++; onQtyChange(); }
});

function onQtyChange() {
  qtyDisplay.textContent = qty;
  const mins = qty * 4;
  durationNote.textContent = `××©× ×××××§×: ~${mins} ××§××ª`;
  selectedSlot = null;
  updateSubmitBtn();
  loadSlots();
}

// ââ load available slots ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
async function loadSlots() {
  slotGrid.innerHTML = '<span class="slot-loading">×××¢× ×©×¢××ª...</span>';
  try {
    const res  = await fetch(`/api/slots?qty=${qty}`);
    const data = await res.json();
    renderSlots(data.slots || []);
  } catch {
    slotGrid.innerHTML = '<span class="no-slots">×©×××× ×××¢×× ×ª ×©×¢××ª</span>';
  }
}

function renderSlots(slots) {
  if (slots.length === 0) {
    slotGrid.innerHTML = '<span class="no-slots">××× ×©×¢××ª ×¤× ××××ª ×××××ª ××</span>';
    return;
  }
  slotGrid.innerHTML = slots.map(s => `
    <button class="slot-btn" onclick="selectSlot('${s}')">${s}</button>
  `).join("");
}

function selectSlot(s) {
  selectedSlot = s;
  document.querySelectorAll(".slot-btn").forEach(b => {
    b.classList.toggle("selected", b.textContent.trim() === s);
  });
  updateSubmitBtn();
}

// ââ submit button state âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function updateSubmitBtn() {
  btnSubmit.disabled = !selectedSlot;
}

// ââ submit ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
btnSubmit.addEventListener("click", async () => {
  errorMsg.textContent = "";
  const name  = document.getElementById("inp-name").value.trim();
  const phone = document.getElementById("inp-phone").value.trim();
  const email = document.getElementById("inp-email").value.trim();

  if (!name)  { errorMsg.textContent = "× × ××××× ×©×"; return; }
  if (!phone) { errorMsg.textContent = "× × ××××× ×××¤××"; return; }

  btnSubmit.disabled = true;
  btnSubmit.textContent = "×©×××...";

  try {
    const res  = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, phone, email, qty, startTime: selectedSlot }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || "×©×××× â × ×¡× ×©× ××ª";
      btnSubmit.disabled = false;
      btnSubmit.textContent = "×©×× ×¨××©××";
      // Reload slots in case the chosen one was taken
      loadSlots();
      selectedSlot = null;
      return;
    }

    // Show success
    const a = data.appt;
    document.getElementById("form-card").style.display = "none";
    const succ = document.getElementById("success-screen");
    succ.style.display = "block";
    document.getElementById("appt-summary").innerHTML =
      `<strong>×©×:</strong> ${a.name}<br>` +
      `<strong>×©×¢×:</strong> ${a.startTime} â ${a.endTime}<br>` +
      `<strong>××××××ª:</strong> ${a.qty}<br>` +
      `<strong>××××¨ ××ª×©××× ×××§××:</strong> ${a.price} âª`;
  } catch {
    errorMsg.textContent = "×©××××ª ×¨×©×ª â × ×¡× ×©× ××ª";
    btnSubmit.disabled = false;
    btnSubmit.textContent = "×©×× ×¨××©××";
  }
});

// ââ init ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
loadSlots();
