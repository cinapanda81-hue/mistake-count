let staffData = JSON.parse(localStorage.getItem("mistakeCountData")) || [];

const staffBody = document.getElementById("staffBody");
const decisionBody = document.getElementById("decisionBody");
const addStaffBtn = document.getElementById("addStaffBtn");
const resetBtn = document.getElementById("resetBtn");
const exportBtn = document.getElementById("exportBtn");

function saveData() {
  localStorage.setItem("mistakeCountData", JSON.stringify(staffData));
}

function formatRupiah(value) {
  const number = Number(value) || 0;
  return "Rp " + number.toLocaleString("id-ID");
}

function getTxnScore(txn) {
  const n = Number(txn) || 0;
  if (n >= 1 && n <= 2) return 0.3;
  if (n >= 3 && n <= 5) return 0.5;
  if (n >= 6 && n <= 7) return 0.8;
  if (n > 7) return 1.0;
  return 0;
}

function getAmountScore(amount) {
  const n = Number(amount) || 0;
  if (n >= 100000 && n <= 200000) return 0.3;
  if (n >= 201000 && n <= 500000) return 0.5;
  if (n >= 501000 && n <= 2000000) return 0.8;
  if (n > 2001000) return 1.0;
  return 0;
}

function calculateRow(item) {
  const txnScore = getTxnScore(item.txn);
  const amountScore = getAmountScore(item.amount);
  const avgScore = (txnScore + amountScore) / 2;
  const weightedScore = (txnScore * 0.3) + (amountScore * 0.7);

  const amount = Number(item.amount) || 0;

  return {
    txnScore,
    amountScore,
    avgScore,
    weightedScore,
    byTxn: amount * txnScore,
    byAmount: amount * amountScore,
    average: amount * avgScore,
    weighted: amount * weightedScore
  };
}

function getFinalAmount(calc, decision) {
  if (decision === "txn") return calc.byTxn;
  if (decision === "amount") return calc.byAmount;
  if (decision === "average") return calc.average;
  return calc.weighted;
}

function render() {
  staffBody.innerHTML = "";
  decisionBody.innerHTML = "";

  if (staffData.length === 0) {
    staffBody.innerHTML = `<tr><td class="empty" colspan="8">Belum ada data staf. Klik "TAMBAH STAF BARU".</td></tr>`;
    decisionBody.innerHTML = `<tr><td class="empty" colspan="7">Belum ada data keputusan.</td></tr>`;
    return;
  }

  staffData.forEach((item, index) => {
    const calc = calculateRow(item);

    const mainRow = document.createElement("tr");
    mainRow.innerHTML = `
      <td><input type="text" value="${item.name}" placeholder="Nama Staf" oninput="updateStaff(${index}, 'name', this.value)"></td>
      <td><input type="number" value="${item.txn}" min="0" placeholder="0" oninput="updateStaff(${index}, 'txn', this.value)"></td>
      <td><input type="number" value="${item.amount}" min="0" placeholder="0" oninput="updateStaff(${index}, 'amount', this.value)"></td>
      <td class="score">${calc.txnScore.toFixed(1)}</td>
      <td class="score">${calc.amountScore.toFixed(1)}</td>
      <td class="score">${calc.avgScore.toFixed(2)}</td>
      <td class="score">${calc.weightedScore.toFixed(2)}</td>
      <td><button class="btn small-danger" onclick="deleteStaff(${index})">Hapus</button></td>
    `;
    staffBody.appendChild(mainRow);

    const finalAmount = getFinalAmount(calc, item.decision);

    const decisionRow = document.createElement("tr");
    decisionRow.innerHTML = `
      <td>${item.name || "-"}</td>
      <td class="money">${formatRupiah(calc.byTxn)}</td>
      <td class="money">${formatRupiah(calc.byAmount)}</td>
      <td class="money">${formatRupiah(calc.average)}</td>
      <td class="money">${formatRupiah(calc.weighted)}</td>
      <td>
        <select onchange="updateStaff(${index}, 'decision', this.value)">
          <option value="weighted" ${item.decision === "weighted" ? "selected" : ""}>Weighted Score</option>
          <option value="txn" ${item.decision === "txn" ? "selected" : ""}>By Txn Score</option>
          <option value="amount" ${item.decision === "amount" ? "selected" : ""}>By Amount Score</option>
          <option value="average" ${item.decision === "average" ? "selected" : ""}>Average</option>
        </select>
      </td>
      <td class="money">${formatRupiah(finalAmount)}</td>
    `;
    decisionBody.appendChild(decisionRow);
  });
}

function addStaff() {
  staffData.push({
    name: "",
    txn: 0,
    amount: 0,
    decision: "weighted"
  });
  saveData();
  render();
}

function updateStaff(index, field, value) {
  staffData[index][field] = value;
  saveData();
  render();
}

function deleteStaff(index) {
  staffData.splice(index, 1);
  saveData();
  render();
}

function resetData() {
  const confirmReset = confirm("Yakin ingin reset semua data?");
  if (!confirmReset) return;

  staffData = [];
  saveData();
  render();
}

function exportExcel() {
  if (staffData.length === 0) {
    alert("Belum ada data untuk diexport.");
    return;
  }

  const rows = staffData.map((item) => {
    const calc = calculateRow(item);
    const finalAmount = getFinalAmount(calc, item.decision);

    return {
      "Nama Staf": item.name || "-",
      "Mistake Txn": Number(item.txn) || 0,
      "Mistake Amount": Number(item.amount) || 0,
      "Txn Score": calc.txnScore,
      "Amount Score": calc.amountScore,
      "AVG Score": calc.avgScore,
      "Weighted Score": calc.weightedScore,
      "By Txn Score": calc.byTxn,
      "By Amount Score": calc.byAmount,
      "Average": calc.average,
      "Weighted Amount": calc.weighted,
      "Final Decision": item.decision,
      "Final Amount": finalAmount
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Mistake Count");
  XLSX.writeFile(workbook, "mistake-count.xlsx");
}

addStaffBtn.addEventListener("click", addStaff);
resetBtn.addEventListener("click", resetData);
exportBtn.addEventListener("click", exportExcel);

render();
