import { makeExecutableSchema } from 'graphql-tools';
import { Mutation } from './mutation';
import { Query } from './query';
import { postTypes } from './resources/post/post.schema';
import { userTypes } from './resources/user/user.schema';
import { commentTypes } from './resources/comment/comment.schema';


const schemaDefinition = `
    type Schema {
        query: Query
        mutation: Mutation
    }
`;

export default makeExecutableSchema({
    typeDefs:[
        schemaDefinition,
        Query,
        Mutation,
        commentTypes,
        postTypes,
        userTypes,
    ],
});