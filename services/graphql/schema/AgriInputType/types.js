const AgriInputType = `
  type AgriInputType {
    _id: String!
    description: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [AgriInputType];
exports.rootTypes = `
  type Query {
    allAgriInputType: [AgriInputType]
  }
  type Mutation {
    createAgriInputType(description: String!): String!
    updateAgriInputType(_id: String!, description: String): String!
    deleteAgriInputType(_id: String!): String!
  }
`;
