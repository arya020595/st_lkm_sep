const GlobalSITCProduct = `
  type GlobalSITCProduct {
    _id: String!
    code: String
    sitcCode: String
    asitcCode: String
    gsitcCode: String
    product: String
    refSTICCode: String
    seq: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
const GlobalSITCProductCreatePayload = `
  input GlobalSITCProductCreatePayload {
    code: String
    sitcCode: String
    asitcCode: String
    gsitcCode: String
    product: String!
    refSTICCode: String
    seq: String
  }
`;

const GlobalSITCProductUpdatePayload = `
  input GlobalSITCProductUpdatePayload {
    code: String
    sitcCode: String
    asitcCode: String
    gsitcCode: String
    product: String
    refSTICCode: String
    seq: String
  }
`;

exports.customTypes = [
  GlobalSITCProduct,
  GlobalSITCProductCreatePayload,
  GlobalSITCProductUpdatePayload,
];
exports.rootTypes = `
  type Query {
    allGlobalSITCProducts: [GlobalSITCProduct]
    allGlobalSITCProductsTokenized: String!
  }
  type Mutation {
    createGlobalSITCProduct(
      code: String
      sitcCode: String
      asitcCode: String
      gsitcCode: String
      product: String!
      refSTICCode: String
      seq: String
    ): String!
    updateGlobalSITCProduct(
      _id: String!, 
      code: String
      sitcCode: String
      asitcCode: String
      gsitcCode: String
      product: String
      refSTICCode: String
      seq: String
    ): String!
    deleteGlobalSITCProduct(_id: String!): String!
  }
`;
