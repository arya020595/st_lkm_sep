const EstateCensusPemilikSaham = `
  type EstateCensusPemilikSaham {
    _id: String!
    estateId: String
    name: String
    share: Float
    censusYear: Int
    recordId: String
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [EstateCensusPemilikSaham]
exports.rootTypes = `
  type Query{
    allEstateCensusPemilikSaham(estateInformationId: String): [EstateCensusPemilikSaham]
  }

  type Mutation {
    createEstateCensusPemilikSaham(
      estateId: String
      name: String
      share: Float
      censusYear: Int
      recordId: String
      estateInformationId: String
    ): String!

    updateEstateCensusPemilikSaham(
      _id: String!
      estateId: String
      name: String
      share: Float
      censusYear: Int
      recordId: String
      estateInformationId: String
    ): String!

    deleteEstateCensusPemilikSaham(_id: String!): String!
  }
`