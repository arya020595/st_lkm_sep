const InfoStatus = `
  type InfoStatus {
    _id: String!
    code: String
    description: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [InfoStatus];
exports.rootTypes = `
  type Query {
    allInfoStatuses: [InfoStatus]
    allInfoStatusesTokenized: String!
  }

  type Mutation {
    createInfoStatus(
      code: String!
      description: String!
    ): String!

    updateInfoStatus(
      _id: String!
      code: String
      description: String
    ): String!

    deleteInfoStatus(_id: String!): String!

  }
`;
