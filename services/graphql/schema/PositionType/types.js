const PositionType = `
  type PositionType {
    _id: String!
    code: String
    description: String

    Division: Division
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [PositionType];
exports.rootTypes = `
  type Query {
    allPositionTypes: [PositionType]
  }
  type Mutation {
    createPositionType(
      code: String!
      description: String!
      divisionId: String!
    ): String!
    updatePositionType(
      _id: String!, 
      code: String
      description: String
      divisionId: String
    ): String!
    deletePositionType(_id: String!): String!
  }
`;
