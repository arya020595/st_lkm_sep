const UnstructuredDocumentInternationalCocoaStandard = `
  type UnstructuredDocumentInternationalCocoaStandard {
    _id: String!
    standard: String
    year: Int
    fileName: String
    fileUrl: String
    mimeType: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [UnstructuredDocumentInternationalCocoaStandard];
exports.rootTypes = `
  type Query {
    allUnstructuredDocumentInternationalCocoaStandards: [UnstructuredDocumentInternationalCocoaStandard]
  }

  type Mutation {
    createUnstructuredDocumentInternationalCocoaStandards(
      standard: String
      year: Int
      fileName: String
      fileUrl: String
    ): String

    updateUnstructuredDocumentInternationalCocoaStandards(
      _id: String!
      standard: String
      year: Int
      fileName: String
      fileUrl: String
    ): String

    deleteUnstructuredDocumentInternationalCocoaStandards(
      _id: String!
    ): String
  }
`;
