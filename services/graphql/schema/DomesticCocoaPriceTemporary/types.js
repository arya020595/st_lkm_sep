const DomesticCocoaPriceTemporary = `
  type DomesticCocoaPriceTemporary {
    _id: String!
    date: String
    Centre: Centre
    Buyer: Buyer
    wetPrice: Float
    smc1: Float
    smc2: Float
    smc3: Float

    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [DomesticCocoaPriceTemporary];
exports.rootTypes = `
  type Query {
    checkTemporaryPrice: String
    getDomesticPriceByCentreTemporary(date: String, centreId: String): [DomesticCocoaPriceTemporary]
    getDomesticPriceByCentreTemporaryTokenized(tokenizedParamsQuery: String!): String!
  }
  type Mutation {
    createDomesticCocoaPriceTemporary(
      date: String!
      buyerId: String!
      centreId: String!

      wetPrice: Float
      smc1: Float
      smc2: Float
      smc3: Float
    ): String!

    updateDomesticCocoaPriceTemporary(
      _id: String!
      date: String!
      buyerId: String!
      centreId: String!

      wetPrice: Float
      smc1: Float
      smc2: Float
      smc3: Float
    ): String!

    deleteDomesticCocoaPriceTemporary(_id: String!): String!
    
    createDomesticCocoaPriceTemporaryTokenized(tokenizedInput: String!): String!
    updateDomesticCocoaPriceTemporaryTokenized(tokenizedInput: String!): String!
    deleteDomesticCocoaPriceTemporaryTokenized(tokenizedInput: String!): String!
  }
`;
