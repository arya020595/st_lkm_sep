const DailyGlobalICCOPrice = `
  type DailyGlobalICCOPrice {
    _id: String!
    date: String!
    currency: String!
    exchangeRate: Float!
    price: Float!
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [DailyGlobalICCOPrice];
exports.rootTypes = `
  type Query {
    allDailyGlobalICCOPrices(date: String!): [DailyGlobalICCOPrice!]!
    dailyGlobalICCOPricesByDate(date: String!): [DailyGlobalICCOPrice!]!  
    countDailyGlobalICCOPrices: Float  
    allDailyGlobalICCOPricesTokenized(date: String!): String!
    dailyGlobalICCOPricesByDateTokenized(date: String!): String!
  }

  type Mutation {
    createDailyGlobalICCOPrice(
      date: String!
      currency: String!
      exchangeRate: Float!
      price: Float!
    ): String!

    updateDailyGlobalICCOPrice(
      _id: String!
      date: String
      currency: String
      exchangeRate: Float
      price: Float!
    ): String!

    deleteDailyGlobalICCOPrice(_id: String!): String!

    createDailyGlobalICCOPriceTokenized(tokenized: String!): String!
    updateDailyGlobalICCOPriceTokenized(tokenized: String!): String!
    deleteDailyGlobalICCOPriceTokenized(tokenized: String!): String!

    generateDailyReportForGlobalICCOPrices(
      yearIds: [String!]
      monthIds: [String!]
    ): String!
    generateMonthlyReportForGlobalICCOPrices(
      yearIds: [String!]
    ): String!
    generateYearlyReportForGlobalICCOPrices(
      fromYearIds: [String!]
      toYearIds: [String!]
    ): String!

    generateCocoaBeanPriceOfInternationalSignificanceReport(
      fromYearIds: [String!]
      toYearIds: [String!]
    ): String!
    generateCocoaBeanMonthlyAverageAndHighLowReport(
      yearIds: [String!]
    ): String!
    generateCocoaBeanMonthlyandAnnualAverageReport(
      fromYearIds: [String!]
      toYearIds: [String!]
    ): String!
    generateICCODailyPriceOfCocoaBeansReport(
      yearIds: [String!]
      currencies: [String!]
    ): String!

    generateDailyInternationalCocoaPriceReport(
      yearIds: [String!]
      monthIds: [String!]
      category: String! # London or New York
    ): String!
    generateMonthlyInternationalCocoaPriceReport(
      yearIds: [String!]
      category: String! # London or New York
    ): String!
    generateYearlyInternationalCocoaPriceReport(
      fromYearIds: [String!]
      toYearIds: [String!]
      category: String! # London or New York
    ): String!
  }
`;
