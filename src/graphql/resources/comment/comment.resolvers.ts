import { GraphQLResolveInfo } from "graphql";
import { Transaction } from "sequelize";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

const authCompose = compose(...authResolvers);

export const commentResolvers = {
    Comment: {
        user: (comment: CommentInstance, args, { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return userLoader.load({ info:info, key:comment.get('user') }).catch(handleError);
        },

        post: (comment: CommentInstance, args, { db , dataloaders: { postLoader }}: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
            return postLoader.load({ info:info, key:comment.get('post') }).catch(handleError);
        },
    },

    Query: {
        commentsByPost: (parent, { postId, first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
            const { db, requestedFields }: ResolverContext = context;
            postId = parseInt(postId);
            return db.Comment.findAll({
                where: { post: postId },
                limit: first,
                offset: offset,
                attributes: requestedFields.getFields(info)
            }).catch(handleError);
        }
    },

    Mutation: {
        createComment: authCompose((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            input.user = authUser.id;
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment.create(input, { transaction: t });
            }).catch(handleError);
        }),
        updateComment: authCompose((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment.findById(id).then((comment: CommentInstance) => {
                    throwError(!comment, `Comment with id ${id} not found!`);
                    throwError(comment.get('user') !== authUser.id, `Unauthorized! You can only edit comments made by yourself!`);
                    input.user = authUser.id;
                    return comment.update(input, { transaction: t });
                });
            }).catch(handleError);
        }),
        deleteComment: authCompose((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.sequelize.transaction((t: Transaction) => {
                return db.Comment.findById(id).then((comment: CommentInstance) => {
                    throwError(!comment, `Comment with id ${id} not found!`);
                    throwError(comment.get('user') !== authUser.id, `Unauthorized! You can only delete comments made by yourself!`);
                    return comment.destroy({ transaction: t }).then((comment: any) => !!comment);
                });
            }).catch(handleError);
        }),
    }
}