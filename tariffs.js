window.FEE_TARIFFS = {
  banks: {
    ofsz: {
      name: "O.F.SZ. Zrt.",
      merchantRate: 0.012,
      schemeFixed: 18,
      schemeRate: 0.0055,
      cards: [
        { id: "mc-personal-debit", name: "Mastercard lakossági betéti", interchangeRate: 0.002 },
        { id: "mc-personal-credit", name: "Mastercard lakossági hitel", interchangeRate: 0.003 },
        { id: "mc-business-credit", name: "Mastercard üzleti hitel", interchangeRate: 0.0175 },
        { id: "mc-business-debit", name: "Mastercard üzleti betéti", interchangeRate: 0.0125 },
        { id: "maestro", name: "Maestro", interchangeRate: 0.002 },
        { id: "visa-personal-debit", name: "Visa lakossági betéti", interchangeRate: 0.002 },
        { id: "visa-personal-credit", name: "Visa lakossági hitel", interchangeRate: 0.003 },
        { id: "visa-business-credit", name: "Visa üzleti hitel", interchangeRate: 0.0135 },
        { id: "visa-business-debit", name: "Visa üzleti betéti", interchangeRate: 0.0135 },
        { id: "vpay", name: "V PAY", interchangeRate: 0.002 }
      ],
      monthlyAccountFee: 0, // Placeholder: 0 Ft
      annualCardFee: 0 // Placeholder: 0 Ft
    }
  },
  terminals: {
    "fizetesi-pont": {
      name: "Fizetési Pont",
      transactionFixed: 7,
      transactionRate: 0.004,
      baseMonthlyFee: 0,
      networkMonthlyFee: 0,
      terminalMonthlyFee: 2350,
      vatRate: 0.27
    }
  }
};
