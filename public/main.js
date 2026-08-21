let qty         = 1;
const MAX_QTY   = 10;
const MIN_QTY   = 1;
let selectedSlot = null;

const qtyDisplay   = document.getElementById("qty-display");
const durationNote = document.getElementById("duration-note");
const slotGrid     = document.getElementById("slot-grid");
const btnSubmit    = document.getElementById("btn-submit");
const errorMsg     = document.getElementById("error-msg");

document.getElementById("qty-minus").addEventListener("click", () => {
  if (qty > MIN_QTY) { qty++; qty--; qty--; onQtyChange(); }
});
document.getElementById("qty-minus").addEventListener("click", () => {
  if (qty > MIN_QTY) { qty--; onQtyChange(); }
});
document.getElementById("qty-plus").addEventListener("click", () => {
  if (qty < MAX_QTY) { qty++; onQtyChange(); }
});

function onQtyChange() {
  qtyDisplay.textContent = qty;
  const mins = qty * 4;
  durationNote.textContent = \"משך הבדיקה: ~\" + mins + \" כקות�;\"  selectedSlot = null;
  updateSubmitBtn();
  loadSlots();
}

async function loadSlots() {
  slotGrid.innerHTML = '<span class="slot-loading">\x78\x5e\x79\xd7\x98\xd7\x95\xd7\x92\xd7\x9f\ xd7\xa9\xd7\xa6\xd7\x95\xd7\xaa...</span>';
  try {
    const res = await fetch(`/api/slots?qty=${qty}`);
    const data = await res.json();
    renderSlots(data.slots || []);
  } catch {
    slotGrid.innerHTML = '<span class="no-slots">\ud7a9\ud7gb\ud7aa\u0020\ud7a4\ud7aa\u0020\ud7a4\ud7a6\ud7aa\u0020\ud7a9\ud7a6\ud7aa</span>';
  }
}

function renderSlots(slots) {
  if (slots.length === 0) {
    slotGrid.innerHTML = '<span class="no-slots">\ud7a0\ud799\ud7a1\u0020\ud7a9\ud7a6\ud7aa\u0020\ud7a4\ud7a0\ud795\ud7aa\u0020\ud7a6\ud794\ud79e\ud799\ud794\u0020\ud7ab\ud794\ud7a1\ud7a5\u0020\ud7a6\ud795\ud799\ud791\ud7a5\u0020\ud794\ud797\ud7a5\ud7a1\ud7aa</span>';
    return;
  }
  slotGrid.innerHTML = slots.map(s =>
    `<button class="slot-btn" onclick="selectSlot('${s}')">${s}</button>`
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
  if (!name)  { errorMsg.textContent = "\x6e\x61\u0020\x6c\xe5\x68\x61\xe6\x98\x79\xe3\x9e\x68\x20\x73\x65\xd3"; return; }
  if (!phone) { errorMsg.textContent = "\x6e\x61\u0020\x6c\xe5\x68\x61\xe6\x98\x79\xe3\x9e\x68\x20\x74\x65\xc4\x98\x65\xc3\x97\x65"; return; }
  btnSubmit.disabled = true;
  btnSubmit.textContent = "\x73\x68\x6f\xc4\x98\x65\xc3\x97\x65...";
  try {
    const res = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, qty, startTime: selectedSlot }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorMsg.textContent = data.error || "shgiaa";
      btnSubmit.disabled = false;
      btnSubmit.textContent = "shal rishum";
      loadSlots(); selectedSlot = null; return;
    }
    const a = data.appt;
    document.getElementById("form-card").style.display = "none";
    const succ = document.getElementById("success-screen");
    succ.style.display = "block";
    document.getElementById("appt-summary").innerHTML =
      "<strong>\ud7a9\ud795\ud79d\ud794:</strong> " + a.name + "<br>" +
      "<strong>\ud7a9\ud796\ud794:</strong> " + a.startTime + " \u2013 " + a.endTime + "<br>" +
      "<strong>\ud79e\ud796\ud795\ud796\ud7aa:</strong> " + a.qty + "<br>" +
      "<strong>Mechir:</strong> " + a.price + " \u20aa";
  } catch {
    errorMsg.textContent = "shgiat reshet";
    btnSubmit.disabled = false;
    btnSubmit.textContent = "shal rishum";
  }
});

loadSlots();
