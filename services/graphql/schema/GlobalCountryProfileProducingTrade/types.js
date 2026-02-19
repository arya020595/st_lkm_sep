const GlobalCountryProfileProducingTrade = `
  type GlobalCountryProfileProducingTrade {
    _id: String!
    GlobalSITCProduct: GlobalSITCProduct
    quantity: Float
    type: String
    value: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [GlobalCountryProfileProducingTrade];
exports.rootTypes = `
  type Query {
    allGlobalCountryProfileProducingTradeByCountryId(countryId: String!): [GlobalCountryProfileProducingTrade]
    allGlobalCountryProfileProducingTradeByCountryIdTokenized(tokenizedParams: String!): String!
  }

  type Mutation {
    createGlobalCountryProfileProducingTrade(
      countryId: String
      countryRegionId: String
      globalSITCProductId: String
      quantity: Float
      type: String
      value: Float 
    ): String!

    updateGlobalCountryProfileProducingTrade(
      _id: String!
      countryId: String
      countryRegionId: String
      globalSITCProductId: String
      quantity: Float
      type: String
      value: Float 
    ): String!

    deleteGlobalCountryProfileProducingTrade(
      _id: String! 
    ): String!

    createGlobalCountryProfileProducingTradeTokenized(tokenized: String!): String!
    updateGlobalCountryProfileProducingTradeTokenized(tokenized: String!): String!
    deleteGlobalCountryProfileProducingTradeTokenized(tokenized: String!): String!
  }
`;
