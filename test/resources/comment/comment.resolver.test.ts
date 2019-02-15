import { db, chai, app, handleError, expect, jwt } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';
import { JWT_SECRET } from '../../../src/utils/utils';
import { PostInstance } from '../../../src/models/PostModel';
import { CommentInstance } from '../../../src/models/CommentModel';

describe('Comment', () => {

    let token: string;
    let userId: number;
    let postId: number;
    let commentId: number;

    beforeEach(() => {
        const condicao = { where: {} };
        return db.Comment.destroy(condicao)
            .then((rows: number) => db.Post.destroy(condicao))
            .then((rows: number) => db.User.destroy(condicao))
            .then((rows: number) => {
                return db.User.create(
                    {
                        name: 'Peter Quill',
                        email: 'peter@guardians.com',
                        password: '1234'
                    }
                ).then((user: UserInstance) => {
                    userId = user.get('id');
                    const payload = { sub: userId };
                    token = jwt.sign(payload, JWT_SECRET);

                    return db.Post.create({
                        title: 'First Post',
                        content: 'This is a first post',
                        author: userId,
                        photo: 'first_photo'
                    }).then((post: PostInstance) => {
                        postId = post.get('id');
                        return db.Comment.bulkCreate([
                            {
                                comment: 'First comment',
                                user: userId,
                                post: postId
                            },
                            {
                                comment: 'Second comment',
                                user: userId,
                                post: postId
                            },
                            {
                                comment: 'Third comment',
                                user: userId,
                                post: postId
                            }
                        ]).then((comments: CommentInstance[]) => {
                            commentId = comments[0].get('id');
                        });
                    });
                });
            }).catch(handleError);
    });

    describe('Queries', () => {
        describe('application/json', () => {
            describe('commentsByPost', () => {

                it('should return a list of Comments', () => {
                    let body = {
                        query: `
                            query getCommentsByPostList($postId: ID!, $first: Int, $offset: Int) {
                                commentsByPost(postId: $postId, first: $first, offset: $offset) {
                                    comment
                                    user {
                                        id
                                    }
                                    post {
                                        id
                                    }
                                }
                            }
                        `,
                        variables: {
                            postId,
                            first: 2,
                            offset: 1
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const commentsList = res.body.data.commentsByPost;
                            expect(res.body.data).to.be.an('object');
                            expect(commentsList).to.be.an('array');
                            expect(commentsList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt']);
                            expect(commentsList[0]).to.have.keys(['comment', 'user', 'post']);
                            expect(parseInt(commentsList[0].user.id)).to.equal(userId);
                            expect(parseInt(commentsList[0].post.id)).to.equal(postId);
                        }).catch(handleError);
                });
            });
        });
    });

    describe('Mutations', () => {
        describe('application/json', () => {
        });
    });

});