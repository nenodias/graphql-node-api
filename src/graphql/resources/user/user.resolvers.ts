import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { UserInstance } from "../../../models/UserModel";
import { Transaction } from "sequelize";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { RequestedFields } from "../../ast/RequestedFields";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

const authCompose = compose(...authResolvers);

const fnFindById = (db: DbConnection, authUser: AuthUser, callback) => {
    return db.sequelize.transaction((t:Transaction)=>{
        return db.User.findById(authUser.id).then((user:UserInstance) =>{
            throwError(!user, `User with id ${authUser.id} not found!`);
            return callback(t, user);
        });
    }).catch(handleError);
};

const optionsAST = { keep: ['id'], exclude: ['posts']};
const postOptionsAST = { keep: ['id'], exclude: ['comments']};

export const userResolvers = {
    User: {
        posts: (user: UserInstance, { first = 10, offset = 0 }, { db, requestedFields }: { db: DbConnection, requestedFields:RequestedFields }, info: GraphQLResolveInfo) => {
            return db.Post
                .findAll({
                    where: {author: user.get('id')},
                    limit: first,
                    offset: offset,
                    attributes: requestedFields.getFields(info, postOptionsAST)
                }).catch(handleError);
        }
    },
    Query: {
        users: (parent, { first = 10, offset = 0 }, { db, requestedFields }: { db: DbConnection, requestedFields:RequestedFields }, info: GraphQLResolveInfo) => {
            return db.User.findAll({
                limit: first,
                offset: offset,
                attributes: requestedFields.getFields(info, optionsAST)
            }).catch(handleError);
        },
        user: (parent, { id }, { db, requestedFields }: { db: DbConnection, requestedFields:RequestedFields }, info: GraphQLResolveInfo) => {
            id = parseInt(id);
            return db.User.findById(id,{
                attributes: requestedFields.getFields(info, optionsAST)
            }).then((user: UserInstance) => {
                throwError(!user, `User with id ${id} not found!`);
                return user;
            }).catch(handleError);
        },
        currentUser: authCompose((parent, args, context: ResolverContext, info: GraphQLResolveInfo) => {
            const { db, authUser, requestedFields }: ResolverContext = context;
            const id = !authUser ? null: authUser.id;
            return db.User.findById(id,{
                attributes: requestedFields.getFields(info, optionsAST)
            }).then((user: UserInstance) => {
                throwError(!user, `User with id ${id} not found!`);
                return user;
            }).catch(handleError);
        })
    },
    Mutation: {
        createUser: (parent, { input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
            return db.sequelize.transaction((t: Transaction) => {
                return db.User.create(input, { transaction: t });
            }).catch(handleError);
        },
        updateUser: authCompose((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return fnFindById(db, authUser, (t: Transaction,user: UserInstance) => {
                return user.update(input, { transaction: t });
            });
        }),
        updateUserPassword: authCompose((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return fnFindById(db, authUser, (t: Transaction,user: UserInstance) => {
                return user.update(input, { transaction: t }).then((user: UserInstance) => !!user);
            });
        }),
        deleteUser:authCompose((parent, args, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
            return fnFindById(db, authUser, (t: Transaction,user: UserInstance) => {
                return user.destroy({transaction:t}).then((user:any) => !!user);
            });
        })
    }
};