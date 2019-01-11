import { makeExecutableSchema } from 'graphql-tools';

const users:any[] = [
    {
        id: 1,
        name: 'John',
        email:'john@gmail.com'
    },
    {
        id: 2,
        name: 'Dany',
        email:'dany@gmail.com'
    }
];

const typeDefs = `
    type User {
        id: ID!
        name: String!
        email: String!
    }

    type Query {
        allUsers: [User!]!
    }
`;

const resolvers = {
    Query: {
        allUsers: () => users
    }
};

export default makeExecutableSchema({typeDefs, resolvers});