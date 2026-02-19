const ProductType = `
  type ProductType {
    _id: String!
    description: String
    AgriInputType:AgriInputType
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [ProductType];
exports.rootTypes = `
  type Query {
    allProductTypes: [ProductType]
  }
  type Mutation {
    createProductType(
      description: String!
      agriInputTypeId: String!
    ): String!
    updateProductType(
      _id: String!, 
      description: String
      agriInputTypeId: String
    ): String!
    deleteProductType(_id: String!): String!
  }
`;
