const UnstruturedDocumentTariff = `
  type UnstruturedDocumentTariff {
    _id: String!
    productTariff: String
    description: String
    fileName: String
    fileUrl: String
    mimeType: String
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [UnstruturedDocumentTariff]
exports.rootTypes = `
  type Query {
    allUnstruturedDocumentTariffs: [UnstruturedDocumentTariff]
  }

  type Mutation {
    createUnstruturedDocumentTariffs(
      productTariff: String
      description: String
      fileName: String
      fileUrl: String
    ): String

    updateUnstruturedDocumentTariffs(
      _id: String!
      productTariff: String
      description: String
      fileName: String
      fileUrl: String
    ): String

    deleteUnstruturedDocumentTariffs(
      _id: String!
    ): String
  }
`