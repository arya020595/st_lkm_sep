const Centre = `
  type Centre {
    _id: String!
    code: String
    description: String
    seq: String
    LocalRegion: LocalRegion

    DomesticCocoaPrice: DomesticCocoaPrice

    countPrice: Int
    listPriceDates: [String]

    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [Centre];
exports.rootTypes = `
  type Query {
    allCentre: [Centre]
    domesticPriceByCentrePerMonth(date: String!): [Centre]
    countDomesticCocoaPrices: Float

    domesticPriceByCentrePerMonthTokenized(date: String!): String!
  }
  
  type Mutation {
    createCentre(
      code: String!
      description: String!
      seq: String
      regionId: String
    ): String!
    updateCentre(
      _id: String!
      code: String
      seq: String
      description: String
      regionId: String
    ): String!
    deleteCentre(_id: String!): String!
  }
`;
