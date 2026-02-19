const LocalState = `
  type LocalState {
    _id: String!
    code: String
    description: String

    LocalRegion: LocalRegion
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [LocalState];
exports.rootTypes = `
  type Query {
    allLocalState: [LocalState]
    allLocalStateByRegionId(regionId: String!): [LocalState]
  }
  type Mutation {
    createLocalState(
      code: String!
      description: String
      regionId: String
    ): String!
    updateLocalState(
      _id: String!, 
      code: String
      description: String
      regionId: String
    ): String!
    deleteLocalState(_id: String!): String!
  }
`;
