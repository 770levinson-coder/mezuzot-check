require("dotenv").config();
const express = require("express");
const path    = require("path");
const { v4: uuid } = require("uuid");
const config  = require("./config");
const store   = require("./lib/store");
const { sendSms } = require("./lib/sms");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// âââ helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function toMin(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function toTime(m) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
function adminOk(req) { return req.query.key === process.env.ADMIN_KEY; }
app.get("/api/event", (req, res) => { res.json(config.event); });
app.get("/api/slots", (req, res) => { const qty = parseInt(req.query.qty, 10); if (!qty || qty < 1 || qty > config.event.maxPerPerson) return res.status(400).json({ error: "××××ª ×× ×ª×§×× ×" }); const duration = qty * config.event.minutesPerMezuza; const startMin = toMin(config.event.startTime); const endMin = toMin(config.event.endTime); const occupied = Object.values(store.all()).map(a => ({ start: toMin(a.startTime), end: toMin(a.startTime) + a.qty * config.event.minutesPerMezuza })); const slots = []; for (let t = startMin; t + duration <= endMin; t += config.event.minutesPerMezuza) { const end = t + duration; const busy = occupied.some(o => !(end <= o.start || t >= o.end)); if (!busy) slots.push(toTime(t)); } res.json({ slots }); });
app.post("/api/register", async (req, res) => { const { name, phone, email, qty, startTime } = req.body; if (!name || !phone || !qty || !startTime) return res.status(400).json({ error: "××¡×¨×× ××¨×××" }); const qtyN = parseInt(qty, 10); if (qtyN < 1 || qtyN > config.event.maxPerPerson) return res.status(400).json({ error: "××××ª ×× ×ª§×× ×" }); const duration = qtyN * config.event.minutesPerMezuza; const tStart = toMin(startTime); const tEnd = tStart + duration; const startMin = toMin(config.event.startTime); const endMin = toMin(config.event.endTime); if (tStart < startMin || tEnd > endMin) return res.status(400).json({ error: "×©×¢× ××× ×ª×§_^g^^Pô¤ì½¹ÍÐ½ÕÁ¥ô=©Ð¹Ù±ÕÌ¡ÍÑ½É¹±° ¤¤¹µÀ¡ôø¡ìÍÑÉÐèÑ½5¥¸¡¹ÍÑÉÑQ¥µ¤°¹èÑ½5¥¸¡¹ÍÑÉÑQ¥µ¤¬¹ÅÑä¨½¹¥¹Ù¹Ð¹µ¥¹ÕÑÍAÉ5éÕéô¤¤ì½¹ÍÐÕÍäô½ÕÁ¥¹Í½µ¡¼ôø¡Ñ¹ðô¼¹ÍÑÉÐñðÑMÑÉÐøô¼¹¹¤¤ì¥¡ÕÍä¤ÉÑÕÉ¸ÉÌ¹ÍÑÑÕÌ ÐÀä¤¹©Í½¸¡ìÉÉ½Èè^S^§^^P^S^[^W^X×H5Ä5è5ä5äuéuê5ê5êuéõå5ä5åõê5êJNÈÛÛÝ[[YHHÕ[YJ[
NÈÛÛÝ\HÈY]ZY

K[YKÛK[XZ[[XZ[]N]SÝ\[YK[[YKXÙN]S
ÛÛYË][XÙT\Y^^KÜX]Y]]È]J
KÒTÓÔÝ[Ê
HNÈÝÜKY
\
NÈÛÛÝ\ÙÈH5æuç5åuçH	Û[Y_Kµê5æuêuåuçµæ5ç5äuäõæuéõêµçµåµåuåµåuê5æõêuê5åõê
È¼'äáH	ØÛÛYË][]_W¼'åd5êuèµå	ÜÝ\[Y_KIÙ[[Y_W¼'äç5åuåµåuåµåuê	Ü]SH5çµåõæuê	Ø\XÙ_H8 ª¼'äãH	ØÛÛYË][ØØ][ÛXÈÙ[Û\ÊÛK\ÙÊKØ]Ú
ÛÛÛÛK\ÜNÈ\ËÛÛÈÚÎYK\JNÈJNÂ\Ù]
ØYZ[
\K\ÊHOÈY
XYZ[ÚÊ\JJH]\\ËÝ]\Ê
ÊKÙ[
ÜY[NÈ\ËÙ[[J]Ú[×Ù\[YKXXÈYZ[[JNÈJNÂ\Ù]
Ø\KØYZ[Ø\Ú[Y[È
\K\ÊHOÈY
XYZ[ÚÊ\JJH]\\ËÝ]\Ê
ÊKÙ[
ÜY[NÈÛÛÝ\ÝHØXÝ[Y\ÊÝÜK[

JKÛÜ

KHOÓZ[KÝ\[YJHHÓZ[Ý\[YJJNÈ\ËÛÛ\Ý
NÈJNÂ\[]JØ\KØYZ[Ø\Ú[Y[ÎY
\K\ÊHOÈY
XYZ[ÚÊ\JJH]\\ËÝ]\Ê
ÊKÙ[
ÜY[NÈÝÜK[[ÝJ\K\[\ËY
NÈ\ËÛÛÈÚÎYHJNÈJNÂ\Ù]
Ø\KØYZ[Ù^Ü
\K\ÊHOÈY
XYZ[ÚÊ\JJH]\\ËÝ]\Ê
ÊKÙ[
ÜY[NÈÛÛÝ\ÝHØXÝ[Y\ÊÝÜK[

JKÛÜ

KHOÓZ[KÝ\[YJHHÓZ[Ý\[YJJNÈÛÛÝXY\HµêuçK5çµåõæuê5ç5çµéõå5çË5çµåµåuåµåuê5ê©õæuè5å5êuéõäH5æuåuçK5çµåõæuê5è5ê5êµçH5àHÈÛÛÝÝÜÈH\ÝX\
HOØK[YKKÛKK[XZ[K]KKÝ\[YKK[[YKKXÙKKÜX]Y]KÚ[JNÈ\ËÙ]XY\ÛÛ[U\H^ØÜÝÈÚ\Ù]]]NNÈ\ËÙ]XY\ÛÛ[Q\ÜÜÚ][Û	Ø]XÚY[È[[[YOHY^^ÝÜÝÊNÈ\ËÙ[
»îïÈ
ÈÚXY\ÝÜ×KÚ[JNÈJNÂ\\Ý[Ô

HOÛÛÛÛKÙÊÙ\\[[ÈÛÜ	ÔÔX
JN
