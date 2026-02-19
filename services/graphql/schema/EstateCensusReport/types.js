const EstateCensus = `
  type EstateCensus {
    _id: String!
    name: String
    LocalState: LocalState
    estateAddress: String
    officeAddress: String
    postageAddress: String
    telephone: String
    PositionType: PositionType

    estateId: String
    recordType: String
    Country: Country
    LocalRegion: LocalRegion
    estateType: String

    censusYear: Int

    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [EstateCensus]
exports.rootTypes = `
  type Query {
    allEstateCensuses: [EstateCensus]
  }
  type Mutation {
    createEstateCensus(
      name: String
      stateId: String
      estateAddress: String
      officeAddress: String
      postageAddress: String
      telephone: String
      positionTypeId: String
  
      estateId: String
      recordType: String
      countryTypeId: String
      regionId: String
      estateType: String
  
      censusYear: Int
    
    ): String!
    updateEstateCensus(
      _id: String!
      name: String
      stateId: String
      estateAddress: String
      officeAddress: String
      postageAddress: String
      telephone: String
      positionTypeId: String
  
      estateId: String
      recordType: String
      countryTypeId: String
      regionId: String
      estateType: String
  
      censusYear: Int
    ): String!
    deleteEstateCensus(_id: String!): String!
  }
`