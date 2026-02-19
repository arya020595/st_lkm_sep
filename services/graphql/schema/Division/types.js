const Division = `
  type Division {
    _id: String!
    code: String
    description: String
    Category: Category
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [Division];
exports.rootTypes = `
  type Query {
    allDivisions: [Division]
  }
  type Mutation {
    createDivision(
      code: String!
      description: String!
      categoryId: String
    ): String!
    updateDivision(
    _id: String!, 
    code: String
    description: String
    categoryId: String
    ): String!
    deleteDivision(_id: String!): String!
  }
`;
