const Citizenship = `
  type Citizenship {
    _id: String!
    code: String
    description: String

    WorkerType: WorkerType
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [Citizenship];
exports.rootTypes = `
  type Query {
    allCitizenship: [Citizenship]
  }
  type Mutation {
    createCitizenship(
      code: String!
      description: String!
      workerTypeId: String
    ): String!
    updateCitizenship(
      _id: String!, 
      code: String
      description: String
      workerTypeId: String
      ): String!
    deleteCitizenship(_id: String!): String!
  }
`;
