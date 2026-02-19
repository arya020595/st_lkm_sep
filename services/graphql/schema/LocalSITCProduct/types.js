const LocalSITCProduct = `
  type LocalSITCProduct {
    _id: String!
    sitcCode: String
    asitcCode: String
    gsitcCode: String
    product: String
    refSTICCode: String
    seq: String

    useForReport: Boolean
    newProduct: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [LocalSITCProduct];
exports.rootTypes = `
  type Query {
    allLocalSITCProducts: [LocalSITCProduct]
  }
  type Mutation {
    createLocalSITCProduct(
      sitcCode: String
      asitcCode: String
      gsitcCode: String
      product: String
      refSTICCode: String
      seq: String
      useForReport: Boolean
      newProduct: String
    ): String!
    updateLocalSITCProduct(
      _id: String!, 
      sitcCode: String
      asitcCode: String
      gsitcCode: String
      product: String
      refSTICCode: String
      seq: String
      useForReport: Boolean
      newProduct: String
    ): String!
    deleteLocalSITCProduct(_id: String!): String!
  }
`;
