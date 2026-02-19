const EstateCensusYearList = `
  type EstateCensusYearList {
    _id: String!
    estateId: String
    year: Int
    EstateInformation: EstateInformation
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [EstateCensusYearList];
exports.rootTypes = `
  type Query {
    allEstateCensusYearList(year: String, years: [String!]): [EstateCensusYearList]
    allEstateCensusYearListByEstate(estateId: String): [EstateCensusYearList]
  }

  type Mutation {
    createEstateCensusYearList(
      estateId: String!
      year: Int
    ): String!

    updateEstateCensusYearList(
      _id: String!
      estateId: String!
      year: Int
    ): String!

    deleteEstateCensusYearList(
      _id: String
    ): String!
  }
  
`;
