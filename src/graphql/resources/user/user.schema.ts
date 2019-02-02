const userTypes = `

    # User definition type
    type User {
        id: ID!
        name: String!
        email: String!
        photo: String
        createtAt: String!
        updatedAt: String!
        posts(first: Int, offset: Int): [ Post! ]!
    }

    input UserCreateInput {
        name: String!
        email: String!
        password: String!
    }

    input UserUpdateInput {
        name: String!
        email: String!
        photo: String!
    }

    input UserUpdatePasswordInout {
        password: String!
    }

`;

const userQueries = `
    users(first: Int, offset: Int): [ User! ]!
    user(id: ID!): User
`;

const userMutations = `
    createUser(input: UserCreateInput!): User
    updateUser(id: ID!, input: UserUpdateInput!): User
    updateUserPassword(id: ID!, input: UserUpdatePasswordInout): Boolean
    deleteUser(id: ID!): Boolean
`;

export {
    userTypes,
    userQueries,
    userMutations
}