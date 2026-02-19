const Buyer = `
  type Buyer {
    _id: String!
    code: String
    name: String
    Centre: Centre
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [Buyer];
exports.rootTypes = `
  type Query {
    allBuyers: [Buyer]
    allBuyersByCentreId(centreId: String!): [Buyer]
    allBuyersByCentreIdTokenized(tokenizedParams: String!): String!
  }

  type Mutation {
    createBuyer(
      code: String
      name: String
      centreId: String
    ): String!

    updateBuyer(
      _id: String!
      code: String
      name: String
      centreId: String
    ): String!
  }
`;
