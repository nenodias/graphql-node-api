import { GraphQLFieldResolver } from "graphql";
import { ResolverContext } from "../../interfaces/ResolverContextInterface";
import { ComposableResolver } from "./composable.resolver";

export const logResolver: ComposableResolver<any, ResolverContext> =
    (resolver: GraphQLFieldResolver<any, ResolverContext>): GraphQLFieldResolver<any, ResolverContext> => {

        return (parent, args, context: ResolverContext, info) => {
            console.log('');
            return resolver(parent, args, context, info);
        };

    };