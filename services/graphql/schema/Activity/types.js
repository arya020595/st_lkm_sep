const Activity = `
  """
  ActivitStringEntity
  """
  type Activity {
    _id: String!
    code: String
    description: String
    _createdAt: String!
    _updatedAt: String!
  }
`;

exports.customTypes = [Activity];
exports.rootTypes = `
  type Query {
    allActivities: [Activity]
  }
  type Mutation {
    createActivity(
      code: String!
      description: String!
    ): String!
    updateActivity
    (
      _id: String!, 
      code: String
      description: String
    ): String!
    deleteActivity(_id: String!): String!
  }
`;
