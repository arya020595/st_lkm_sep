const CocoaMonitor = `
  type CocoaMonitor {
    _id: String!
    code: String
    censusYear: Int
    value: Float
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [CocoaMonitor];
exports.rootTypes = `
  type Query {
    allCocoaMonitor(
      year: String, years: [String!]
    ): [CocoaMonitor]
    countCocoaMonitor: Int!
  }
  type Mutation {
    createCocoaMonitor(
      code: String!
      censusYear: Int
      value: Float
    ): String!
    updateCocoaMonitor(
      _id: String!, 
      code: String
      censusYear: Int
      value: Float
      ): String!
    deleteCocoaMonitor(_id: String!): String!
  }
`;
