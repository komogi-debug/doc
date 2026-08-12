const sample = `發文機關：臺北市○○區公所
發文字號：北市○○字第1150001234號
速別：普通件
密等及解密條件或保密期限：普通
主旨：檢送本所115年度業務執行成果調查表1份，請貴單位於115年8月20日前填復，請查照。
說明：
一、為彙整本年度業務執行情形，請依附件表格填列辦理情形、執行成果及相關數據。
二、如有未執行或執行落後情形，請一併敘明原因及改善措施。
附件：115年度業務執行成果調查表1份。`;

const SOURCES = [
  { title: "行政院文書處理手冊", url: "https://www.ey.gov.tw/Page/43FD318D966A30DD", note: "公文處理、文別與製作規範的官方入口。" },
  { title: "文書處理手冊（行政院，112 年 9 月）", url: "https://www.ey.gov.tw/File/2549CDCFAACC57E1?A=C", note: "公文製作與文書處理的官方手冊版本。" },
  { title: "政府文書格式參考規範", url: "https://theme.ndc.gov.tw/lawout/LawContent.aspx?id=GL000235&media=print", note: "提供政府文書格式與撰寫方式的參考規範。" },
];

const $ = (id) => document.getElementById(id);
const asText = (value) => String(value ?? "");

function clean(value) { return asText(value).replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim(); }
function firstMatch(pattern, value) { const match = value.match(pattern); return match ? match[1].trim() : ""; }
function field(label, value) {
  const labels = "發文機關|發文字號|速別|密等及解密條件或保密期限|主旨|說明|辦法|附件|正本|副本";
  return firstMatch(new RegExp("(?:^|\\n)\\s*" + label + "\\s*[：:]\\s*(.*?)(?=\\n\\s*(?:" + labels + ")\\s*[：:]|$)", "s"), value);
}
function dates(value) {
  const found = value.match(/(?:民國)?\d{2,4}年\s*\d{1,2}月\s*\d{1,2}日|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?<!年)\d{1,2}月\s*\d{1,2}日/g) || [];
  return [...new Set(found)];
}
function classify(value) {
  const rules = [
    [["補件", "補正", "補充資料", "檢附"], "資料補件／檢送"],
    [["調查表", "填復", "填報", "回填"], "資料填報／調查"],
    [["開會", "會議", "出席", "派員"], "會議／出席通知"],
    [["轉請", "移請", "權責", "管轄"], "轉辦／權責判斷"],
    [["陳情", "申訴", "反映", "建議"], "陳情／申訴回覆"],
    [["請惠復", "函復", "復請", "回覆"], "一般函復"],
  ];
  for (const [keywords, label] of rules) if (keywords.some((keyword) => value.includes(keyword))) return [label, "依來文中的關鍵用語初步判斷，仍請承辦人確認權責。"];
  return ["一般行政來文", "尚未辨識出明確文類，請先確認對方要求與本機關權責。"];
}
function bullets(value) {
  if (!value) return [];
  return value.split(/\n(?=\s*[一二三四五六七八九十]+、|\s*\(?[一二三四五六七八九十]+\)?[、.)])/).map((part) => part.replace(/^\s*(?:[一二三四五六七八九十]+、|\(?[一二三四五六七八九十]+\)?[、.)])\s*/, "").trim()).filter(Boolean);
}
function makeReplies(type, subject, attachment) {
  if (type.includes("資料填報") || type.includes("補件")) return [
    { label: "已完成／同意回覆", text: "主旨：復貴單位來函事項，請查照。\n說明：\n一、依來函辦理。\n二、資料如附件。" },
    { label: "尚待確認資料", text: "主旨：復貴單位來函事項，請查照。\n說明：\n一、相關資料刻正整理中。\n二、完成後另函檢送。" },
  ];
  if (type.includes("會議")) return [
    { label: "派員出席", text: "主旨：復貴單位會議通知，請查照。\n說明：\n一、派員○○○出席。" },
    { label: "無法出席／提供意見", text: "主旨：復貴單位會議通知，請查照。\n說明：\n一、因故無法派員出席，敬請見諒。" },
  ];
  return [
    { label: "一般函復骨架", text: "主旨：復貴單位來函事項，請查照。\n說明：\n一、依來函辦理。\n二、○○○。" },
    { label: "請示主管後回覆", text: "主旨：復貴單位來函事項，請查照。\n說明：\n一、刻正洽詢中。\n二、俟核示後另函復。" },
  ];
}
function analyze(raw, context) {
  const value = clean(raw);
  if (!value) throw new Error("請先貼上公文內容。");
  const subject = field("主旨", value), explanation = field("說明", value), procedure = field("辦法", value), attachment = field("附件", value);
  const sender = firstMatch(/(?:^|\n)\s*發文機關\s*[：:]\s*(.+)/, value), number = firstMatch(/(?:^|\n)\s*發文字號\s*[：:]\s*(.+)/, value), urgency = firstMatch(/(?:^|\n)\s*速別\s*[：:]\s*(.+)/, value);
  const [type, typeNote] = classify(value), foundDates = dates(value), listed = bullets(explanation || procedure);
  const requestText = [subject, explanation, procedure].filter(Boolean).join("\n");
  const asks = requestText.split(/(?<=[。；])|\n/).map((item) => item.trim()).filter((item) => item && ["請", "填復", "填報", "檢送", "提供", "出席", "回覆"].some((word) => item.includes(word))).slice(0, 5);
  const tasks = [];
  if (foundDates.length) tasks.push(`確認期限：${foundDates[0]}（公文未必明確表示所有日期都是截止日，請回看原文）`);
  if (attachment) tasks.push("開啟並檢查附件，確認是否需要填寫、核章或另行回傳。");
  tasks.push(asks.length ? "逐項回應來文要求，先向主管或權責單位確認事實與數據。" : "先確認對方希望本機關採取的具體行動，再判斷是否需要函復。");
  tasks.push("完成草稿後，依機關內部流程送主管審核，不要直接對外發文。");
  const warnings = { 個資: "可能涉及個人資料，寄送前確認必要性、遮蔽與傳遞方式。", 機密: "出現機密或保密用語，請依機關保密程序處理。", 處分: "可能涉及行政處分或權利義務，請交由權責與法制單位確認。", 契約: "可能涉及契約責任，請確認契約條款及核決權限。", 金額: "涉及金額或經費，請核對來源、科目與核決權限。", 期限: "有期限壓力，建議立即登錄待辦並確認起算方式。" };
  const risks = Object.entries(warnings).filter(([term]) => value.includes(term)).map(([, warning]) => warning);
  if (!subject) risks.push("未辨識到主旨欄位，請確認上傳內容是否完整。");
  if (!sender) risks.push("未辨識到發文機關，請確認來源與權責。");
  if (!risks.length) risks.push("目前未發現明顯高風險詞，仍須由承辦人核對事實、期限與權責。");
  const summary = (subject || listed[0] || "這是一份需要承辦人進一步判斷的行政來文。").slice(0, 180);
  return { plain_language: `對新手來說：對方主要是在處理「${summary}」。目前判斷文類為「${type}」。`, summary, metadata: { sender: sender || "未辨識", number: number || "未辨識", urgency: urgency || "未辨識", dates: foundDates.length ? foundDates : ["未辨識明確日期"], type }, asks: asks.length ? asks : ["未辨識明確要求，請確認主旨、說明及附件。"], tasks, questions: ["本案由哪個單位或承辦人負責？", "來文要求的資料是否已經存在，且數據是否經主管確認？", "是否有機關內部範本、核章或會辦流程？"], risks, replies: makeReplies(type, subject, attachment), sources: SOURCES, disclaimer: "這是輔助分析，不是正式法律意見或核准結果。正式回覆前請由承辦人及主管確認。此 GitHub Pages 版本在瀏覽器中以規則分析，公文內容不會送到本機器人的後端。", context_received: Boolean(context.trim()), type_note: typeNote };
}

function escapeHtml(value) { return asText(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", "\"":"&quot;" }[char])); }
function renderList(target, items, warning = false) { $(target).innerHTML = (items || []).map((item) => `<div class="item ${warning ? "warning-item" : ""}">${escapeHtml(item)}</div>`).join(""); }
function render(data) {
  $("plainLanguage").textContent = data.plain_language; $("summary").textContent = data.summary;
  const labels = { sender:"發文機關", number:"發文字號", urgency:"速別", dates:"日期", type:"初步文類" };
  $("metadata").innerHTML = Object.entries(data.metadata).map(([key, value]) => `<div class="meta"><strong>${labels[key] || key}</strong>${escapeHtml(Array.isArray(value) ? value.join("、") : value)}</div>`).join("");
  renderList("asks", data.asks); renderList("tasks", data.tasks); renderList("questions", data.questions); renderList("risks", data.risks, true);
  $("replies").innerHTML = data.replies.map((reply, index) => `<article class="reply"><div class="reply-label">${escapeHtml(reply.label)}</div><div class="reply-text" id="reply-${index}">${escapeHtml(reply.text)}</div><button class="copy-btn" data-copy="reply-${index}">複製草稿</button></article>`).join("");
  document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => { try { await navigator.clipboard.writeText($(button.dataset.copy).textContent); } catch { const range = document.createRange(); range.selectNode($(button.dataset.copy)); window.getSelection().removeAllRanges(); window.getSelection().addRange(range); document.execCommand("copy"); } button.textContent = "已複製"; setTimeout(() => button.textContent = "複製草稿", 1600); }));
  $("sourcesList").innerHTML = data.sources.map((source) => `<div><a href="${source.url}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} ↗</a><span>${escapeHtml(source.note)}</span></div>`).join("");
  $("disclaimer").textContent = data.disclaimer; $("result").hidden = false; setTimeout(() => $("result").scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

$("sampleBtn").addEventListener("click", () => { $("documentText").value = sample; $("documentText").focus(); });
$("fileInput").addEventListener("change", async (event) => { const file = event.target.files[0]; if (file) $("documentText").value = await file.text(); });
$("newBtn").addEventListener("click", () => { $("result").hidden = true; window.scrollTo({ top: 0, behavior: "smooth" }); });
$("analyzeBtn").addEventListener("click", () => { const error = $("errorBox"), button = $("analyzeBtn"); error.hidden = true; button.disabled = true; button.innerHTML = "分析中…"; try { render(analyze($("documentText").value, $("contextText").value)); } catch (err) { error.textContent = err.message; error.hidden = false; } finally { button.disabled = false; button.innerHTML = "開始解讀 <span>→</span>"; } });
