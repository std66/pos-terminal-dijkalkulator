(() => {
  "use strict";

  const tariffs = window.FEE_TARIFFS;
  const currency = new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 0
  });

  const bankSelect = document.getElementById("bank-provider");
  const terminalSelect = document.getElementById("terminal-provider");
  const inputsBody = document.getElementById("card-inputs");
  const bankResultsBody = document.getElementById("bank-results");
  const errorMessage = document.getElementById("calculation-error");
  const results = document.getElementById("results");

  function formatFt(amount) {
    return `${currency.format(amount)} Ft`;
  }

  function formatPercent(rate) {
    return `${new Intl.NumberFormat("hu-HU", {
      style: "percent",
      maximumFractionDigits: 2
    }).format(rate)}`;
  }

  function addOptions(select, entries) {
    for (const [id, item] of Object.entries(entries)) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = item.name;
      select.append(option);
    }
  }

  function makeInput(id, label, className, suffix) {
    const input = document.createElement("input");
    input.type = "number";
    input.id = `${id}-${suffix}`;
    input.className = className;
    input.min = "0";
    input.step = "1";
    input.value = "0";
    input.required = true;
    input.setAttribute("aria-label", label);
    return input;
  }

  function renderCardInputs() {
    const bank = tariffs.banks[bankSelect.value];
    inputsBody.replaceChildren();
    for (const card of bank.cards) {
      const row = document.createElement("tr");
      const name = document.createElement("th");
      name.scope = "row";
      name.textContent = card.name;

      const interchange = document.createElement("td");
      interchange.textContent = formatPercent(card.interchangeRate);

      const countCell = document.createElement("td");
      countCell.append(makeInput(card.id, `${card.name}: havi tranzakciószám`, "count-input", "count"));

      const amountCell = document.createElement("td");
      amountCell.append(makeInput(card.id, `${card.name}: havi forgalom forintban`, "amount-input", "amount"));

      row.append(name, interchange, countCell, amountCell);
      inputsBody.append(row);
    }
  }

  function getInputValue(input, label) {
    const value = input.valueAsNumber;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${label}: adj meg nem negatív egész számot.`);
    }
    return value;
  }

  function getVolumes(cards) {
    return cards.map((card) => {
      const countInput = document.getElementById(`${card.id}-count`);
      const amountInput = document.getElementById(`${card.id}-amount`);
      return {
        card,
        count: getInputValue(countInput, `${card.name} tranzakciószáma`),
        turnover: getInputValue(amountInput, `${card.name} forgalma`)
      };
    });
  }

  function calculateBank(bank, volumes) {
    const rows = volumes.map(({ card, count, turnover }) => {
      const merchantFee = Math.round(turnover * bank.merchantRate);
      const interchangeFee = Math.round(turnover * card.interchangeRate);
      const schemeFee = Math.round(turnover * bank.schemeRate + count * bank.schemeFixed);
      return {
        name: card.name,
        merchantFee,
        interchangeFee,
        schemeFee,
        total: merchantFee + interchangeFee + schemeFee
      };
    });
    const transactionFees = rows.reduce((sum, row) => sum + row.total, 0);
    return {
      rows,
      transactionFees,
      accountFee: bank.monthlyAccountFee,
      monthlyFee: transactionFees + bank.monthlyAccountFee,
      annualCardFee: bank.annualCardFee
    };
  }

  function calculateTerminal(terminal, volumes) {
    const transactionCount = volumes.reduce((sum, item) => sum + item.count, 0);
    const turnover = volumes.reduce((sum, item) => sum + item.turnover, 0);
    const variableNet = Math.round(
      transactionCount * terminal.transactionFixed + turnover * terminal.transactionRate
    );
    const variableVat = Math.round(variableNet * terminal.vatRate);
    const fixedNet =
      terminal.baseMonthlyFee + terminal.networkMonthlyFee + terminal.terminalMonthlyFee;
    const fixedVat = Math.round(fixedNet * terminal.vatRate);
    return {
      variableNet,
      variableVat,
      fixedNet,
      fixedVat,
      monthlyGross: variableNet + variableVat + fixedNet + fixedVat
    };
  }

  function renderBankResults(bankResult) {
    bankResultsBody.replaceChildren();
    for (const item of bankResult.rows) {
      const row = document.createElement("tr");
      const values = [
        item.name,
        formatFt(item.merchantFee),
        formatFt(item.interchangeFee),
        formatFt(item.schemeFee),
        formatFt(item.total)
      ];
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.scope = "row";
        cell.textContent = value;
        row.append(cell);
      });
      bankResultsBody.append(row);
    }
    document.getElementById("bank-total").textContent = formatFt(bankResult.monthlyFee);
    document.getElementById("account-fee").textContent = formatFt(bankResult.accountFee);
    document.getElementById("card-fee").textContent = formatFt(bankResult.annualCardFee);
  }

  function update() {
    try {
      const bank = tariffs.banks[bankSelect.value];
      const terminal = tariffs.terminals[terminalSelect.value];
      if (!bank || !terminal) {
        throw new Error("A kiválasztott díjszabás nem érhető el.");
      }
      const volumes = getVolumes(bank.cards);
      const bankResult = calculateBank(bank, volumes);
      const terminalResult = calculateTerminal(terminal, volumes);
      const monthlyTotal = bankResult.monthlyFee + terminalResult.monthlyGross;
      const monthlyTurnover = volumes.reduce((sum, item) => sum + item.turnover, 0);
      const annualTotal = monthlyTotal * 12 + bankResult.annualCardFee;

      renderBankResults(bankResult);
      document.getElementById("terminal-variable-net").textContent = formatFt(terminalResult.variableNet);
      document.getElementById("terminal-variable-vat").textContent = formatFt(terminalResult.variableVat);
      document.getElementById("terminal-fixed-net").textContent = formatFt(terminalResult.fixedNet);
      document.getElementById("terminal-fixed-vat").textContent = formatFt(terminalResult.fixedVat);
      document.getElementById("terminal-total").textContent = formatFt(terminalResult.monthlyGross);
      document.getElementById("monthly-total").textContent = formatFt(monthlyTotal);
      document.getElementById("monthly-net").textContent = formatFt(monthlyTurnover - monthlyTotal);
      document.getElementById("annual-total").textContent = formatFt(annualTotal);
      errorMessage.hidden = true;
      results.hidden = false;
    } catch (error) {
      errorMessage.textContent = error instanceof Error
        ? error.message
        : "A kalkuláció során váratlan hiba történt.";
      errorMessage.hidden = false;
      results.hidden = true;
    }
  }

  addOptions(bankSelect, tariffs.banks);
  addOptions(terminalSelect, tariffs.terminals);
  renderCardInputs();
  bankSelect.addEventListener("change", () => {
    renderCardInputs();
    update();
  });
  terminalSelect.addEventListener("change", update);
  inputsBody.addEventListener("input", update);
  update();
})();
