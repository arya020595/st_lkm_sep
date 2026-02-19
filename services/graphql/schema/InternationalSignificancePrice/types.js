const InternationalSignificancePrice = `
  type InternationalSignificancePrice {
    _id: String!
    year: Int!
    month: Int
    Source: Source
    sourceName: String

    londonFuture: Float
    newYorkFuture: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [InternationalSignificancePrice];
exports.rootTypes = `
  type Query {
    allInternationalSignificancePrices(year: String, years: [String!]): [InternationalSignificancePrice!]!
    allInternationalSignificancePricesTokenized(year: String, years: [String!]): String!
  }

  type Mutation {
    createInternationalSignificancePrice(
      year: Int!
      month: Int
      sourceId: String!

      londonFuture: Float
      newYorkFuture: Float
    ): String!

    updateInternationalSignificancePrice(
      _id: String!
      year: Int!
      month: Int
      sourceId: String!
      
      londonFuture: Float
      newYorkFuture: Float
    ): String!

    deleteInternationalSignificancePrice(_id: String!): String!

    createInternationalSignificancePriceTokenized(tokenized: String!): String!
    updateInternationalSignificancePriceTokenized(tokenized: String!): String!
    deleteInternationalSignificancePriceTokenized(tokenized: String!): String!
  }
`;
