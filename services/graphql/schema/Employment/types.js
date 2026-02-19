const Employment = `
  type Employment {
    _id: String!
    year: Int!
    Category: Category
    Division: Division
    PositionType: PositionType
    LocalRegion: LocalRegion
    noOfWorker: String
    nationality: String
    workerType: String


    divisionName: String
    categoryName: String
    regionName: String
    _createdAt: String!
    _updatedAt: String!
  }
`;
exports.customTypes = [Employment];
exports.rootTypes = `
  type Query {
    allEmployments(year: String, years: [String]): [Employment]
    countEmployments: Float

    allEmploymentsTokenized(year: String, years: [String]): String!
  }

  type Mutation {
    createEmployment(
      year: Int!
      categoryId: String!
      divisionId: String!
      #positionTypeId: String!
      localRegionId: String
      noOfWorker: String
      nationality: String
      workerType: String
    ): String!

    updateEmployment(
      _id: String!
      year: Int
      categoryId: String
      divisionId: String
      #positionTypeId: String
      localRegionId: String
      noOfWorker: String
      nationality: String
      workerType: String
    ): String!
    deleteEmployment(_id: String!): String!


    createEmploymentTokenized(tokenizedInput: String!): String!
    updateEmploymentTokenized(tokenizedInput: String!): String!
    deleteEmploymentTokenized(tokenizedInput: String!): String!
  }
`;
