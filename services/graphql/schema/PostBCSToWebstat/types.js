exports.customTypes = [];
exports.rootTypes = `
  type Mutation {
    sendToWebstatBCSGlobal(year: String, type: String, years: [String]): String!
  }
`;