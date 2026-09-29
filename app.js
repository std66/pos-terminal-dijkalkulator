(() => {
  "use strict";

  const tariffs = window.FEE_TARIFFS;
  const currency = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });
  const cardNames = Object.fromEntries(
    Object.values(tariffs.banks)
      .flatMap((bank) => bank.cards)
      .map((card) => [card.csvType, card.name])
  );
  const csvTypes = new Set(Object.keys(cardNames));

  const bankSelect = document.getElementById("bank-provider");
  const terminalSelect = document.getElementById("terminal-provider");
  const fileInput = document.getElementById("csv-file");
  const fileStatus = document.getElementById("file-status");
  const bankResultsBody = document.getElementById("bank-results");
  const errorMessage = document.getElementById("calculation-error");
  const results = document.getElementById("results");
  const providerMessages = document.getElementById("provider-messages");
  let transactions = [];

  function formatFt(amount) {
    return `${currency.format(amount)} Ft`;
  }

  function formatPercent(rate) {
    return new Intl.NumberFormat("hu-HU", {
      style: "percent",
      maximumFractionDigits: 2
    }).format(rate);
  }

  function addOptions(select, entries) {
    for (const [id, item] of Object.entries(entries)) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = item.pricingModel
        ? `${item.name} — ${item.pricingModel}`
        : item.name;
      select.append(option);
    }
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    let closedQuote = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];

      if (inQuotes) {
        if (character === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            inQuotes = false;
            closedQuote = true;
          }
        } else {
          field += character;
        }
        continue;
      }

      if (closedQuote && character !== "," && character !== "\r" && character !== "\n") {
        if (!/\s/.test(character)) {
          throw new Error(`Hibás CSV-idézőjel a ${rows.length + 1}. sorban.`);
        }
        continue;
      }

      if (character === '"' && field.length === 0) {
        inQuotes = true;
      } else if (character === ",") {
        row.push(field.trim());
        field = "";
        closedQuote = false;
      } else if (character === "\r" || character === "\n") {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(field.trim());
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        field = "";
        closedQuote = false;
      } else {
        if (character === '"') {
          throw new Error(`Hibás CSV-idézőjel a ${rows.length + 1}. sorban.`);
        }
        field += character;
      }
    }

    if (inQuotes) {
      throw new Error("A CSV-fájlban lezáratlan idézőjel található.");
    }

    if (field !== "" || row.length > 0 || closedQuote) {
      row.push(field.trim());
      if (row.some((value) => value !== "")) rows.push(row);
    }

    if (rows.length < 2) {
      throw new Error("A CSV-fájl nem tartalmaz tranzakciós sort.");
    }

    const header = rows[0].map((value, index) =>
      index === 0 ? value.replace(/^\uFEFF/, "") : value
    );
    const expectedHeaders = ["date", "card_type", "amount"];
    if (
      header.length !== expectedHeaders.length ||
      expectedHeaders.some((name) => !header.includes(name))
    ) {
      throw new Error("A CSV-fejlécnek pontosan a date,card_type,amount oszlopokat kell tartalmaznia.");
    }
    const columns = Object.fromEntries(header.map((name, index) => [name, index]));

    return rows.slice(1).map((values, index) => {
      const lineNumber = index + 2;
      if (values.length !== header.length) {
        throw new Error(`${lineNumber}. sor: három oszlop szükséges.`);
      }

      const date = values[columns.date];
      if (!isValidIsoDate(date)) {
        throw new Error(`${lineNumber}. sor: érvénytelen dátum (${date}). A formátum YYYY-MM-DD.`);
      }

      const cardType = values[columns.card_type];
      if (!csvTypes.has(cardType)) {
        throw new Error(`${lineNumber}. sor: nem támogatott card_type érték (${cardType}).`);
      }

      const amountText = values[columns.amount];
      if (!/^\d+$/.test(amountText)) {
        throw new Error(`${lineNumber}. sor: az amount legyen egész forintban megadva.`);
      }
      const amount = Number(amountText);
      if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error(`${lineNumber}. sor: az amount pozitív, biztonságosan ábrázolható egész szám legyen.`);
      }

      return { date, month: date.slice(0, 7), cardType, amount };
    });
  }

  function isValidIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }

  function calculateBank(bank, records, monthCount) {
    const cardByType = new Map(bank.cards.map((card) => [card.csvType, card]));
    const byType = new Map();

    for (const transaction of records) {
      const card = cardByType.get(transaction.cardType);
      if (!card) {
        throw new Error(`A kiválasztott bankhoz nincs díjszabás ehhez a kártyatípushoz: ${transaction.cardType}.`);
      }

      const merchantRate = card.merchantRate ?? bank.merchantRate;
      const schemeRate = card.schemeRate ?? bank.schemeRate;
      const schemeFixed = card.schemeFixed ?? bank.schemeFixed;
      const fees = {
        merchantFee: Math.round(transaction.amount * merchantRate),
        interchangeFee: Math.round(transaction.amount * card.interchangeRate),
        schemeFee: Math.round(transaction.amount * schemeRate + schemeFixed)
      };
      fees.total = fees.merchantFee + fees.interchangeFee + fees.schemeFee;

      let total = byType.get(transaction.cardType);
      if (!total) {
        total = {
          name: card.name,
          count: 0,
          turnover: 0,
          merchantFee: 0,
          interchangeFee: 0,
          schemeFee: 0,
          total: 0
        };
        byType.set(transaction.cardType, total);
      }

      total.count += 1;
      total.turnover += transaction.amount;
      total.merchantFee += fees.merchantFee;
      total.interchangeFee += fees.interchangeFee;
      total.schemeFee += fees.schemeFee;
      total.total += fees.total;
    }

    const rows = [...byType.values()];
    const transactionFees = rows.reduce((sum, item) => sum + item.total, 0);
    const accountFee = bank.monthlyAccountFee * monthCount;
    const annualCardFee = bank.annualCardFee;
    return {
      rows,
      transactionFees,
      accountFee,
      annualCardFee,
      total: transactionFees + accountFee + annualCardFee
    };
  }

  function calculateTerminal(terminal, records, monthCount) {
    const variableNet = records.reduce((sum, transaction) => {
      return sum + Math.round(
        terminal.transactionFixed + transaction.amount * terminal.transactionRate
      );
    }, 0);
    const variableVat = records.reduce((sum, transaction) => {
      const netFee = Math.round(
        terminal.transactionFixed + transaction.amount * terminal.transactionRate
      );
      return sum + Math.round(netFee * terminal.vatRate);
    }, 0);
    const monthlyFixedNet =
      terminal.baseMonthlyFee + terminal.networkMonthlyFee + terminal.terminalMonthlyFee;
    const fixedNet = monthlyFixedNet * monthCount;
    const fixedVat = Math.round(monthlyFixedNet * terminal.vatRate) * monthCount;
    return {
      variableNet,
      variableVat,
      fixedNet,
      fixedVat,
      total: variableNet + variableVat + fixedNet + fixedVat
    };
  }

  function renderBankResults(bankResult) {
    bankResultsBody.replaceChildren();
    for (const item of bankResult.rows) {
      const row = document.createElement("tr");
      const values = [
        item.name,
        currency.format(item.count),
        formatFt(item.turnover),
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

    document.getElementById("bank-total").textContent = formatFt(bankResult.total);
    document.getElementById("account-fee").textContent = formatFt(bankResult.accountFee);
    document.getElementById("card-fee").textContent = formatFt(bankResult.annualCardFee);
  }

  function renderProviderMessages(bank, terminal) {
    providerMessages.replaceChildren();
    for (const message of [...(bank.messages ?? []), ...(terminal.messages ?? [])]) {
      const element = document.createElement("p");
      element.className = "provider-message";
      element.dataset.type = message.type;
      element.textContent = message.text;
      providerMessages.append(element);
    }
  }

  function renderResults() {
    try {
      if (transactions.length === 0) {
        results.hidden = true;
        return;
      }
      const bank = tariffs.banks[bankSelect.value];
      const terminal = tariffs.terminals[terminalSelect.value];
      if (!bank || !terminal) {
        throw new Error("A kiválasztott díjszabás nem érhető el.");
      }

      const monthCount = new Set(transactions.map((transaction) => transaction.month)).size;
      const turnover = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const bankResult = calculateBank(bank, transactions, monthCount);
      const terminalResult = calculateTerminal(terminal, transactions, monthCount);
      const totalFees = bankResult.total + terminalResult.total;
      const dates = transactions.map((transaction) => transaction.date).sort();

      renderBankResults(bankResult);
      renderProviderMessages(bank, terminal);
      document.getElementById("transaction-count").textContent = currency.format(transactions.length);
      document.getElementById("csv-turnover").textContent = formatFt(turnover);
      document.getElementById("total-fees").textContent = formatFt(totalFees);
      document.getElementById("net-proceeds").textContent = formatFt(turnover - totalFees);
      document.getElementById("period-summary").textContent =
        `${dates[0]} – ${dates[dates.length - 1]} · ${monthCount} érintett naptári hónap`;
      document.getElementById("terminal-variable-net").textContent = formatFt(terminalResult.variableNet);
      document.getElementById("terminal-variable-vat").textContent = formatFt(terminalResult.variableVat);
      document.getElementById("terminal-fixed-net").textContent = formatFt(terminalResult.fixedNet);
      document.getElementById("terminal-fixed-vat").textContent = formatFt(terminalResult.fixedVat);
      document.getElementById("terminal-total").textContent = formatFt(terminalResult.total);
      document.getElementById("covered-months").textContent = currency.format(monthCount);
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

  async function loadCsv() {
    const file = fileInput.files?.[0];
    transactions = [];
    results.hidden = true;
    errorMessage.hidden = true;
    fileStatus.textContent = "";
    if (!file) return;

    try {
      fileStatus.textContent = "CSV-fájl feldolgozása…";
      const content = await file.text();
      transactions = parseCsv(content.replace(/^\uFEFF/, ""));
      fileStatus.textContent = `${file.name}: ${currency.format(transactions.length)} tranzakció beolvasva.`;
      renderResults();
    } catch (error) {
      transactions = [];
      fileStatus.textContent = "";
      errorMessage.textContent = error instanceof Error
        ? error.message
        : "A CSV-fájl feldolgozása nem sikerült.";
      errorMessage.hidden = false;
      results.hidden = true;
    }
  }

  addOptions(bankSelect, tariffs.banks);
  addOptions(terminalSelect, tariffs.terminals);
  fileInput.addEventListener("change", loadCsv);
  bankSelect.addEventListener("change", () => {
    renderProviderMessages(tariffs.banks[bankSelect.value], tariffs.terminals[terminalSelect.value]);
    renderResults();
  });
  terminalSelect.addEventListener("change", () => {
    renderProviderMessages(tariffs.banks[bankSelect.value], tariffs.terminals[terminalSelect.value]);
    renderResults();
  });
  renderProviderMessages(tariffs.banks[bankSelect.value], tariffs.terminals[terminalSelect.value]);
})();
