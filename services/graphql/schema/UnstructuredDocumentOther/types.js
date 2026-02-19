const UnstructuredDocumentOther = `
  type UnstructuredDocumentOther {
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
exports.customTypes = [UnstructuredDocumentOther];
exports.rootTypes = `
  type Query {
    allUnstructuredDocumentOthers: [UnstructuredDocumentOther]
  }

  type Mutation {
    createUnstructuredDocumentOthers(
      standard: String
      year: Int
      fileName: String
      fileUrl: String
    ): String

    updateUnstructuredDocumentOthers(
      _id: String!
      standard: String
      year: Int
      fileName: String
      fileUrl: String
    ): String

    deleteUnstructuredDocumentOthers(
      _id: String!
    ): String
  }
`;
