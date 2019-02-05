import { makeExecutableSchema } from 'graphql-tools';
import { merge } from 'lodash';
import { Mutation } from './mutation';
import { Query } from './query';
import { commentResolvers } from './resources/comment/comment.resolvers';
import { commentTypes } from './resources/comment/comment.schema';
import { postResolvers } from './resources/post/post.resolvers';
import { postTypes } from './resources/post/post.schema';
import { tokenResolvers } from './resources/token/token.resolvers';
import { tokenTypes } from './resources/token/token.schema';
import { userResolvers } from './resources/user/user.resolvers';
import { userTypes } from './resources/user/user.schema';

const resolvers = merge(
    commentResolvers,
    postResolvers,
    tokenResolvers,
    userResolvers
);

const schemaDefinition = `
    type Schema {
        query: Query
        mutation: Mutation
    }
`;

export default makeExecutableSchema({
    typeDefs: [
        schemaDefinition,
        Query,
        Mutation,
        commentTypes,
        postTypes,
        tokenTypes,
        userTypes,
    ],
    resolvers
});