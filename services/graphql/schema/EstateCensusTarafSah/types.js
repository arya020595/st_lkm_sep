const EstateCensusTarafSah = `
  type EstateCensusTarafSah {
    _id: String!
    estateId: String
    legalStatus: String
    state: String
    owner: String
    censusYear: Int
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [EstateCensusTarafSah]
exports.rootTypes = `
  type Query{
    allTarafSah(estateInformationId: String): [EstateCensusTarafSah]
  }

  type Mutation {
    createTarafSah(
      estateId: String
      legalStatus: String
      state: String
      owner: String
      censusYear: Int
      refComStatusId: String
    ): String!

    updateTarafSah(
      _id: String!
      estateId: String
      legalStatus: String
      state: String
      owner: String
      censusYear: Int
      refComStatusId: String
    ): String!

    deleteTarafSah(_id: String!): String!
  }
`