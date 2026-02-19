const LocalRegion = `
  type LocalRegion {
    _id: String!
    code: String
    description: String

    States: [LocalState]
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [LocalRegion];
exports.rootTypes = `
  type Query {
    allLocalRegion: [LocalRegion]
    allLocalRegionTokenized: String!
  }
  type Mutation {
    createLocalRegion(
      code: String!
      description: String!
    ): String!
    updateLocalRegion(
      _id: String!, 
      code: String
      description: String
    ): String!
    deleteLocalRegion(_id: String!): String!
  }
`;
