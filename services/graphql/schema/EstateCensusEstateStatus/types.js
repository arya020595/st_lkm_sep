const EstateCensusEstateStatus = `
  type EstateCensusEstateStatus {
    _id: String!
    status: String!
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [EstateCensusEstateStatus]
exports.rootTypes = `
  type Query {
    allEstateCensusEstateStatus: [EstateCensusEstateStatus]
  }
`