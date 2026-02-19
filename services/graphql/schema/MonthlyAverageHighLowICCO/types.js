const MonthlyAverageHighLowICCOPrice = `
  type MonthlyAverageHighLowICCOPrice {
    _id: String!
    year: Int!
    month: Int
    
    Source: Source
    sourceName: String

    averageSDR: Float
    highestSDR: Float
    lowestSDR: Float
    averageUSD: Float
    highestUSD: Float
    lowestUSD: Float

    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [MonthlyAverageHighLowICCOPrice];
exports.rootTypes = `
  type Query {
    allMonthlyAverageHighLowICCOPrices(year: String, years: [String!]): [MonthlyAverageHighLowICCOPrice!]!
    allMonthlyAverageHighLowICCOPricesTokenized(year: String, years: [String!]): String! 
  }

  type Mutation {
    createMonthlyAverageHighLowICCOPrice(
      year: Int!
      month: Int
      
      sourceId: String

      averageSDR: Float
      highestSDR: Float
      lowestSDR: Float
      averageUSD: Float
      highsetUSD: Float
      lowestUSD: Float
    ): String!

    updateMonthlyAverageHighLowICCOPrice(
      _id: String!
      year: Int!
      month: Int
      
      sourceId: String

      averageSDR: Float
      highestSDR: Float
      lowestSDR: Float
      averageUSD: Float
      highsetUSD: Float
      lowestUSD: Float
    ): String!

    deleteMonthlyAverageHighLowICCOPrice(_id: String!): String!

    createMonthlyAverageHighLowICCOPriceTokenized(tokenized: String!): String!
    updateMonthlyAverageHighLowICCOPriceTokenized(tokenized: String!): String!
    deleteMonthlyAverageHighLowICCOPriceTokenized(tokenized: String!): String!
  }
`;
