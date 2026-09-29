window.FEE_TARIFFS = {
  banks: {
    ofsz: {
      name: "O.F.SZ. Zrt.",
      pricingModel: "Interchange Pass-Through",
      merchantRate: 0.012,
      schemeFixed: 18,
      schemeRate: 0.0055,
      messages: [
        {
          type: "info",
          text: "Az OFSZ díjszabása a táblázatban szereplő, más bank által kibocsátott kártyák bankközi jutalékaival számol."
        }
      ],
      cards: [
        { id: "mc-personal-debit", csvType: "mc_ret_db", name: "Mastercard lakossági betéti", interchangeRate: 0.002 },
        { id: "mc-personal-credit", csvType: "mc_ret_cr", name: "Mastercard lakossági hitelkártya", interchangeRate: 0.003 },
        { id: "mc-business-debit", csvType: "mc_bus_db", name: "Mastercard üzleti betéti", interchangeRate: 0.0125 },
        { id: "mc-business-credit", csvType: "mc_bus_cr", name: "Mastercard üzleti hitelkártya", interchangeRate: 0.0175 },
        { id: "maestro", csvType: "maestro", name: "Maestro lakossági kártya", interchangeRate: 0.002 },
        { id: "visa-personal-debit", csvType: "vi_ret_db", name: "Visa lakossági betéti", interchangeRate: 0.002 },
        { id: "visa-personal-credit", csvType: "vi_ret_cr", name: "Visa lakossági hitelkártya", interchangeRate: 0.003 },
        { id: "visa-business-debit", csvType: "vi_bus_db", name: "Visa üzleti betéti", interchangeRate: 0.0135 },
        { id: "visa-business-credit", csvType: "vi_bus_cr", name: "Visa üzleti hitelkártya", interchangeRate: 0.0135 }
      ],
      monthlyAccountFee: 0, // Placeholder: 0 Ft
      annualCardFee: 0 // Placeholder: 0 Ft
    },
    otp: {
      name: "OTP Bank",
      pricingModel: "Költségalapú (IC++ jellegű)",
      merchantRate: 0.007,
      messages: [
        {
          type: "info",
          text: "A kalkuláció a gyakori kártyatípusokra és a magyarországi, nem OTP-s kártyákra vonatkozó díjfeltevéseket használja. Az üzleti kártyák bankközi díja 1,65%."
        },
        {
          type: "warn",
          text: "Az OTP kereskedői díja egyedi szerződéses; a számítás tájékoztató jelleggel a nyilvános példában szereplő 0,7%-ot használja."
        }
      ],
      cards: [
        { id: "mc-personal-debit", csvType: "mc_ret_db", name: "Mastercard lakossági betéti", interchangeRate: 0.002, schemeFixed: 11.23, schemeRate: 0.001208 },
        { id: "mc-personal-credit", csvType: "mc_ret_cr", name: "Mastercard lakossági hitelkártya", interchangeRate: 0.003, schemeFixed: 11.23, schemeRate: 0.001208 },
        { id: "mc-business-debit", csvType: "mc_bus_db", name: "Mastercard üzleti betéti", interchangeRate: 0.0165, schemeFixed: 11.23, schemeRate: 0.001208 },
        { id: "mc-business-credit", csvType: "mc_bus_cr", name: "Mastercard üzleti hitelkártya", interchangeRate: 0.0165, schemeFixed: 11.23, schemeRate: 0.001208 },
        { id: "maestro", csvType: "maestro", name: "Maestro lakossági kártya", interchangeRate: 0.002, schemeFixed: 1, schemeRate: 0.000001 },
        { id: "visa-personal-debit", csvType: "vi_ret_db", name: "Visa lakossági betéti", interchangeRate: 0.002, schemeFixed: 4.88, schemeRate: 0.001795 },
        { id: "visa-personal-credit", csvType: "vi_ret_cr", name: "Visa lakossági hitelkártya", interchangeRate: 0.003, schemeFixed: 4.90, schemeRate: 0.001845 },
        { id: "visa-business-debit", csvType: "vi_bus_db", name: "Visa üzleti betéti", interchangeRate: 0.0165, schemeFixed: 4.88, schemeRate: 0.001795 },
        { id: "visa-business-credit", csvType: "vi_bus_cr", name: "Visa üzleti hitelkártya", interchangeRate: 0.0165, schemeFixed: 4.90, schemeRate: 0.001845 }
      ],
      monthlyAccountFee: 0, // Placeholder: 0 Ft
      annualCardFee: 0 // Placeholder: 0 Ft
    }
  },
  terminals: {
    "fizetesi-pont": {
      name: "Fizetési Pont",
      messages: [
        {
          type: "info",
          text: "A tranzakciónkénti díj és a forgalomarányos díj nettó összegére 27% ÁFA kerül."
        }
      ],
      transactionFixed: 7,
      transactionRate: 0.004,
      baseMonthlyFee: 0,
      networkMonthlyFee: 0,
      terminalMonthlyFee: 2350,
      vatRate: 0.27
    }
  }
};
