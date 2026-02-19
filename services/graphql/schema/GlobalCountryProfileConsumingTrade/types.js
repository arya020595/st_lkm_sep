const GlobalCountryProfileConsumingTrade = `
  type GlobalCountryProfileConsumingTrade {
    _id: String!
    GlobalSITCProduct: GlobalSITCProduct
    quantity: Float
    type: String
    value: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [GlobalCountryProfileConsumingTrade];
exports.rootTypes = `
  type Query {
    allGlobalCountryProfileConsumingTradeByCountryId(countryId: String!): [GlobalCountryProfileConsumingTrade]
    allGlobalCountryProfileConsumingTradeByCountryIdTokenized(tokenizedParams: String!): String!
  }

  type Mutation {
    createGlobalCountryProfileConsumingTrade(
      countryId: String
      countryRegionId: String
      globalSITCProductId: String
      quantity: Float
      type: String
      value: Float 
    ): String!

    updateGlobalCountryProfileConsumingTrade(
      _id: String!
      countryId: String
      countryRegionId: String
      globalSITCProductId: String
      quantity: Float
      type: String
      value: Float 
    ): String!

    deleteGlobalCountryProfileConsumingTrade(
      _id: String! 
    ): String!

    createGlobalCountryProfileConsumingTradeTokenized(tokenized: String!): String!
    updateGlobalCountryProfileConsumingTradeTokenized(tokenized: String!): String!
    deleteGlobalCountryProfileConsumingTradeTokenized(tokenized: String!): String!
  }
`;
