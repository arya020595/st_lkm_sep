import gql from "graphql-tag";

const QUERY = gql`
  query currentUser {
    currentUser {
      _id
      name
      email
      phone
      roleId
      Role {
        _id
        name
      }
    }
  }
`;

const checkLoggedIn = apolloClient => {
  return apolloClient
    .query({
      query: QUERY,
    })
    .then(({ data }) => {
      // console.log({ data });
      return { loggedInUser: data };
    })
    .catch(error => {
      // console.log({ error });
      // Fail gracefully
      return { loggedInUser: {} };
    });
};

export default checkLoggedIn;
