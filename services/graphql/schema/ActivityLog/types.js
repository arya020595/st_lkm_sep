const AcitivityLog = `
  scalar JSON
  type AcitivityLog {
    _id: String!
    originalDocument: JSON
    updatedDocument: JSON
    _createdAt: String!
    _updatedAt: String!
  }
`
exports.customTypes = [AcitivityLog]
exports.rootTypes = `
  type Query {
    allActivityLogs: [AcitivityLog]
  }
`