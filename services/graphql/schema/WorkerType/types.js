const WorkerType = `
  type WorkerType {
    _id: String!
    code: String
    description: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [WorkerType];
exports.rootTypes = `
  type Query {
    allWorkerType: [WorkerType]
  }
  type Mutation {
    createWorkerType(
      code: String!
      description: String!
    ): String!
    updateWorkerType(
      _id: String!, 
      code: String
      description: String
    ): String!
    deleteWorkerType(_id: String!): String!
  }
`;
