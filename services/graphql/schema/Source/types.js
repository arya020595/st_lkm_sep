const Source = `
  type Source {
    _id: String!
    code: String
    description: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [Source];
exports.rootTypes = `
  type Query {
    allSources: [Source]

    allSourcesTokenized: String!
  }
  type Mutation {
    createSource(
      code: String
      description: String!
    ): String!
    updateSource(
      _id: String!, 
      code: String
      description: String
    ): String!
    deleteSource(_id: String!): String!
  }
`;
