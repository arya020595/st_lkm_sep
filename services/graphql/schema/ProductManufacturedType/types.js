const ProductManufacturedType = `
  type ProductManufacturedType {
    _id: String!
    type: String!
    code: String!
    name: String!
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [ProductManufacturedType];
exports.rootTypes = `
  type Query {
    allProductManufacturedTypes: [ProductManufacturedType]
  }

  type Mutation {
    createProductManufacturedType(
      type: String!
      code: String!
      name: String!
    ): String!

    updateProductManufacturedType(
      _id: String!
      type: String
      code: String
      name: String
    ): String!

    deleteProductManufacturedType(_id: String!): String!
  }
`;
