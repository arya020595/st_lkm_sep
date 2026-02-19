const UnstructuredDocumentIncentive = `
  type UnstructuredDocumentIncentive {
    _id: String!
    incentiveInvestment: String
    description: String
    fileName: String
    fileUrl: String
    mimeType: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [UnstructuredDocumentIncentive];
exports.rootTypes = `
  type Query {
    allUnstructuredDocumentIncentives: [UnstructuredDocumentIncentive]
  }

  type Mutation {
    createUnstructuredDocumentIncentives(
      incentiveInvestment: String
      description: String
      fileName: String
      fileUrl: String
    ): String

    updateUnstructuredDocumentIncentives(
      _id: String!
      incentiveInvestment: String
      description: String
      fileName: String
      fileUrl: String
    ): String

    deleteUnstructuredDocumentIncentives(
      _id: String!
    ): String
  }
`;
