const RefComStatuses = `
  type RefComStatuses {
    _id: String!
    comStatus: String!
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [RefComStatuses]
exports.rootTypes = `
  type Query {
    allRefComStatuses: [RefComStatuses]
  }
`