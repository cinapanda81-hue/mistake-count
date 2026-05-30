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
  return "Rp " + (Number(value) || 0).toLocaleString("id-ID");
}

function getTxnScore(txn) {
  txn = Number(txn) || 0;
  if (txn >= 1 && txn <= 2) return 0.3;
  if (txn >= 3 && txn <= 5) return 0.5;
  if (txn >= 6 && txn <= 7) return 0.8;
  if (txn > 7) return 1.0;
  return 0;
}

function getAmountScore(amount) {
  amount = Number(amount) || 0;
  if (amount >= 100000 && amount <= 200000) return 0.3;
  if (amount >= 201000 && amount <= 500000) return 0.5;
  if (amount >= 501000 && amount <= 2000000) return 0.8;
  if (amount > 2001000) return 1.0;
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

function updateData(index, field, value) {
  staffData[index][field] = value;
  saveData();
  updateCalculatedCells(index);
}

function updateCalculatedCells(index) {
  const item = staffData[index];
  const calc = calculateRow(item);
  const finalAmount = getFinalAmount(calc, item.decision);

  document.getElementById(`txnScore-${index}`).textContent = calc.txnScore.toFixed(1);
  document.getElementById(`amountScore-${index}`).textContent = calc.amountScore.toFixed(1);
  document.getElementById(`avgScore-${index}`).textContent = calc.avgScore.toFixed(2);
  document.getElementById(`weightedScore-${index}`).textContent = calc.weightedScore.toFixed(2);

  document.getElementById(`decisionName-${index}`).textContent = item.name || "-";
  document.getElementById(`byTxn-${index}`).textContent = formatRupiah(calc.byTxn);
  document.getElementById(`byAmount-${index}`).textContent = formatRupiah(calc.byAmount);
  document.getElementById(`average-${index}`).textContent = formatRupiah(calc.average);
  document.getElementById(`weighted-${index}`).textContent = formatRupiah(calc.weighted);
  document.getElementById(`finalAmount-${index}`).textContent = formatRupiah(finalAmount);
}

function updateDecision(index, value) {
  staffData[index].decision = value;
  saveData();
  updateCalculatedCells(index);
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
    const finalAmount = getFinalAmount(calc, item.decision);

    staffBody.innerHTML += `
      <tr>
        <td>
          <input 
            type="text" 
            value="${item.name || ""}" 
            placeholder="Nama Staf"
            oninput="updateData(${index}, 'name', this.value)"
          >
        </td>

        <td>
          <input 
            type="number" 
            value="${item.txn || ""}" 
            min="0" 
            placeholder="0"
            oninput="updateData(${index}, 'txn', this.value)"
          >
        </td>

        <td>
          <input 
            type="number" 
            value="${item.amount || ""}" 
            min="0" 
            placeholder="0"
            oninput="updateData(${index}, 'amount', this.value)"
          >
        </td>

        <td class="score" id="txnScore-${index}">${calc.txnScore.toFixed(1)}</td>
        <td class="score" id="amountScore-${index}">${calc.amountScore.toFixed(1)}</td>
        <td class="score" id="avgScore-${index}">${calc.avgScore.toFixed(2)}</td>
        <td class="score" id="weightedScore-${index}">${calc.weightedScore.toFixed(2)}</td>
        <td><button class="btn small-danger" onclick="deleteStaff(${index})">Hapus</button></td>
      </tr>
    `;

    decisionBody.innerHTML += `
      <tr>
        <td id="decisionName-${index}">${item.name || "-"}</td>
        <td class="money" id="byTxn-${index}">${formatRupiah(calc.byTxn)}</td>
        <td class="money" id="byAmount-${index}">${formatRupiah(calc.byAmount)}</td>
        <td class="money" id="average-${index}">${formatRupiah(calc.average)}</td>
        <td class="money" id="weighted-${index}">${formatRupiah(calc.weighted)}</td>
        <td>
          <select onchange="updateDecision(${index}, this.value)">
            <option value="weighted" ${item.decision === "weighted" ? "selected" : ""}>Weighted Score</option>
            <option value="txn" ${item.decision === "txn" ? "selected" : ""}>By Txn Score</option>
            <option value="amount" ${item.decision === "amount" ? "selected" : ""}>By Amount Score</option>
            <option value="average" ${item.decision === "average" ? "selected" : ""}>Average</option>
          </select>
        </td>
        <td class="money" id="finalAmount-${index}">${formatRupiah(finalAmount)}</td>
      </tr>
    `;
  });
}

function addStaff() {
  staffData.push({
    name: "",
    txn: "",
    amount: "",
    decision: "weighted"
  });

  saveData();
  render();
}

function deleteStaff(index) {
  staffData.splice(index, 1);
  saveData();
  render();
}

function resetData() {
  if (!confirm("Yakin ingin reset semua data?")) return;

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
