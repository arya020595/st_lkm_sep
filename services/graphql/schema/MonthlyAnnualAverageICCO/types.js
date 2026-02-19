const MonthlyAnnualAverageICCO = `
  type MonthlyAnnualAverageICCO {
    _id: String!
    year: Int!
    month: Int
    Source: Source
    sourceName: String

    sdrTonne: Float
    usdCent: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [MonthlyAnnualAverageICCO];
exports.rootTypes = `
  type Query {
    allMonthlyAnnualAverageICCO(year: String, years: [String!]): [MonthlyAnnualAverageICCO!]!
    allMonthlyAnnualAverageICCOTokenized(year: String, years: [String!]): String!
  }

  type Mutation {
    createMonthlyAverageAnnualICCOPrice(
      year: Int!
      month: Int!
      sourceId: String!
      sdrTonne: Float
      usdCent: Float
    ): String!

    updateMonthlyAverageAnnualICCOPrice(
      _id: String!
      year: Int!
      month: Int!
      sourceId: String!
      sdrTonne: Float
      usdCent: Float
    ): String!

    deleteMonthlyAverageAnnualICCOPrice(_id: String!): String!
    createMonthlyAverageAnnualICCOPriceTokenized(tokenized: String!): String!
    updateMonthlyAverageAnnualICCOPriceTokenized(tokenized: String!): String!
    deleteMonthlyAverageAnnualICCOPriceTokenized(tokenized: String!): String!
  }
`;
