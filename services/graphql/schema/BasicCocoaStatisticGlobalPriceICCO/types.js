const BasicCocoaStatisticGlobalPriceICCO = `
  type BasicCocoaStatisticGlobalPriceICCO {
    _id: String!
    date: String
    currency: String
    exchangeRate: Float
    price: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [BasicCocoaStatisticGlobalPriceICCO];
exports.rootTypes = `
  type Query {
    allBasicCocoaStatisticGlobalPriceICCOs(year: String!): [BasicCocoaStatisticGlobalPriceICCO]
    countBasicCocoaStatisticGlobalPriceICCOs: Float
  }

  type Mutation {
    createBasicCocoaStatisticGlobalPriceICCO(
      date: String
      currency: String
      exchangeRate: Float
      price: Float
    ): String!

    updateBasicCocoaStatisticGlobalPriceICCO(
      _id: String!
      date: String
      currency: String
      exchangeRate: Float
      price: Float
    ): String!

    deleteBasicCocoaStatisticGlobalPriceICCO(
      _id: String!
    ): String!
  }
  
`;
