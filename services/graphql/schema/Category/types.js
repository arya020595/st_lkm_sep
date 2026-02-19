const Category = `
  type Category {
    _id: String!
    code: String
    description: String

    Divisions: [Division]
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [Category];
exports.rootTypes = `
  type Query {
    allCategories: [Category]

    allCategoriesTokenized: String!
  }
  type Mutation {
    createCategory(
      code: String!
      description: String!
    ): String!
    updateCategory(
      _id: String!, 
      code: String
      description: String
      ): String!
    deleteCategory(_id: String!): String!
  }
`;
