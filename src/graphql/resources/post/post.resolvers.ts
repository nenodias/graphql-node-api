import * as graphqlFields from 'graphql-fields';
import { GraphQLResolveInfo } from "graphql";
import { Transaction } from "sequelize";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { PostInstance } from "../../../models/PostModel";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';

const authCompose = compose(...authResolvers);

const optionsAST = {keep: ['id'], exclude:['comments']};

export const postResolvers = {

    Post: {
        author: (post: PostInstance, args, { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return userLoader.load({ info:info, key:post.get('author') }).catch(handleError);
        },

        comments: (post: PostInstance, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            const { db, requestedFields } : ResolverContext = context;
            return db.Comment.findAll({
                where: { post: post.get('id') },
                limit: first,
                offset: offset,
                attributes: requestedFields.getFields(info)
            }).catch(handleError);
        }
    },

    Query: {
        posts: (parent, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            const { db, requestedFields } : ResolverContext = context;
            return db.Post.findAll({
                limit: first,
                offset: offset,
                attributes: requestedFields.getFields(info, optionsAST)
            }).catch(handleError);
        },
        post: (parent, { id }, context: ResolverContext, info: GraphQLResolveInfo) => {
            const { db, requestedFields } : ResolverContext = context;
            id = parseInt(id);
            return db.Post.findById(id,{
                    attributes:requestedFields.getFields(info, optionsAST)
                })
                .then((post: PostInstance) => {
                    throwError(!post, `Post with id ${id} not found!`);
                    return post;
                }).catch(handleError);
        }
    },

    Mutation: {

        createPost: authCompose((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            input.author = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post.create(input, { transaction: t });
            }).catch(handleError);
        }),

        updatePost: authCompose((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post.findById(id).then(post => {
                    throwError(!post, `Post with id ${id} not found!`);
                    throwError(post.get('author') !== authUser.id, `Unauthorized! You can only edit posts made by yourself!`);
                    input.author = authUser.id;
                    return post.update(input, { transaction: t });
                });
            }).catch(handleError);
        }),

        deletePost: authCompose((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) =>{
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Post.findById(id).then(post => {
                    throwError(!post, `Post with id ${id} not found!`);
                    throwError(post.get('author') !== authUser.id, `Unauthorized! You can only delete posts made by yourself!`);
                    return post.destroy({ transaction: t }).then((post:any) => !!post);
                });
            }).catch(handleError);
        })
    }
}