const DomesticCocoaPrice = `
  type DomesticCocoaPrice {
    _id: String!
    date: String
    Centre: Centre
    Buyer: Buyer
    wetPrice: Float
    smc1: Float
    smc2: Float
    smc3: Float

    wetHigh: Float
    wetLow: Float
    wetAverage: Float

    smc1High: Float
    smc1Low: Float
    smc1Average: Float

    smc2High: Float
    smc2Low: Float
    smc2Average: Float

    smc3High: Float
    smc3Low: Float
    smc3Average: Float

    _createdAt: String!
    _updatedAt: String!
  }
  
  type ReportProgress {
    status: String!
    progress: Int!
    reportUrl: String
  }
`;
exports.customTypes = [DomesticCocoaPrice];
exports.rootTypes = `
  type Query {
    domesticPricePerMonth(date: String): [DomesticCocoaPrice]
    getDomesticPriceByCentre(date: String, centreId: String): [DomesticCocoaPrice]
    getDomesticPriceTotalByDate(date: String!): Int!
    getLastUpdateDomesticPrice(date: String!): String!
    getLastUpdateDomesticPricePushedToWBC(date: String!): String!
    getReportProgress(reportId: String!): ReportProgress!

    domesticPricePerMonthTokenized(date: String): String!
    getDomesticPriceByCentreTokenized(tokenizedParams: String!): String!
  }
  type Mutation {
    createDomesticCocoaPrice(
      date: String!
      buyerId: String!
      centreId: String!

      wetPrice: Float
      smc1: Float
      smc2: Float
      smc3: Float
    ): String!

    updateDomesticCocoaPrice(
      _id: String!
      date: String!
      buyerId: String!
      centreId: String!

      wetPrice: Float
      smc1: Float
      smc2: Float
      smc3: Float
    ): String!

    deleteDomesticCocoaPrice(
      _id: String!
    ): String!

    createDomesticCocoaPriceTokenized(tokenizedInput: String!): String!
    updateDomesticCocoaPriceTokenized(tokenizedInput: String!): String!
    deleteDomesticCocoaPriceTokenized(tokenizedInput: String!): String!
    
    generateDailySummaryReportForDomesticCocoaPrices (
      date: String!
      signersName: [String!]
    ): String!
    generateDailyAverageReportForDomesticCocoaPrices (
      yearIds: [String!]
      monthIds: [String!]
      centreIds: [String!]
    ): String!
    generateDailyCocoaPriceReportForDomesticCocoaPrices (
      yearIds: [String!]
      monthIds: [String!]
      gradeIds: [String!]
    ): String!
    generateDailyBuyerReportForDomesticCocoaPrices (
      startDate: String!
      endDate: String!
      centreIds: [String!]
      buyerIds: [String!]
    ): String!
    generateMonthlyBuyerReportForDomesticCocoaPrices (
      yearIds: [String!]
      monthIds: [String!]
      centreIds: [String!]
      buyerIds: [String!]
    ): String!

    generateWeeklySummaryReportForDomesticCocoaPrices (
      yearIds: [String!]
      monthIds: [String!]
      weekIds: [String!]
    ): String!
    generateWeeklyAverageReportForDomesticCocoaPrices (
      yearIds: [String!]
      monthIds: [String!]
      centreIds: [String!]
    ): String!
    generateWeeklyCocoaPriceReportForDomesticCocoaPrices (
      yearIds: [String!]
      monthIds: [String!]
      gradeIds: [String!]
    ): String!

    generateMonthlySummaryReportForDomesticCocoaPrices (
      yearIds: [String!]
      monthIds: [String!]
    ): String!
    generateMonthlyAverageReportForDomesticCocoaPrices (
      yearIds: [String!]
      centreIds: [String!]
    ): String!
    generateMonthlyCocoaPriceReportForDomesticCocoaPrices (
      yearIds: [String!]
      gradeIds: [String!]
    ): String!

    generateQuarterlySummaryReportForDomesticCocoaPrices (
      yearIds: [String!]
      quarterIds: [String!]
    ): String!
    generateQuarterlyAverageReportForDomesticCocoaPrices (
      yearIds: [String!]
      centreIds: [String!]
    ): String!
    generateQuarterlyCocoaPriceReportForDomesticCocoaPrices (
      yearIds: [String!]
      gradeIds: [String!]
    ): String!

    generateYearlySummaryReportForDomesticCocoaPrices (
      yearIds: [String!]
    ): String!
    generateYearlyAverageReportForDomesticCocoaPrices (
      fromYearIds: [String!]
      toYearIds: [String!]
      centreIds: [String!]
    ): String!
    generateYearlyCocoaPriceReportForDomesticCocoaPrices (
      fromYearIds: [String!]
      toYearIds: [String!]
      gradeIds: [String!]
    ): String!
    generateYearlyAverageCentreReportForDomesticCocoaPrices (
      fromYearIds: [String!]
      toYearIds: [String!]
      centreIds: [String!]
      gradeIds: [String!]
    ): String!

    generateYearlyAverageCentreReportForDomesticCocoaPricesWithGrade (
      fromYearIds: [String!]
      toYearIds: [String!]
      centreIds: [String!]
      gradeIds: [String!]
    ): String!

    resendDailyToWebEKoko(date: String!): String!
  }
`;
