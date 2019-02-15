import { db, chai, app, handleError, expect, jwt } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';
import { JWT_SECRET } from '../../../src/utils/utils';
import { PostInstance } from '../../../src/models/PostModel';

describe('Post', () => {

    let token: string;
    let userId: number;
    let postId: number;

    beforeEach(() => {
        const condicao = { where: {} };
        return db.Comment.destroy(condicao)
            .then((rows: number) => db.Post.destroy(condicao))
            .then((rows: number) => db.User.destroy(condicao))
            .then((rows: number) => {
                return db.User.create(
                    {
                        name: 'Rocket',
                        email: 'rocket@guardians.com',
                        password: '1234'
                    }
                ).then((user: UserInstance) => {
                    userId = user.get('id');
                    const payload = { sub: userId };
                    token = jwt.sign(payload, JWT_SECRET);

                    return db.Post.bulkCreate([
                        {
                            title: 'First Post',
                            content: 'This is a first post',
                            author: userId,
                            photo: 'first_photo'
                        },
                        {
                            title: 'Second Post',
                            content: 'This is a second post',
                            author: userId,
                            photo: 'second_photo'
                        },
                        {
                            title: 'Third Post',
                            content: 'This is a third post',
                            author: userId,
                            photo: 'third_photo'
                        }
                    ]).then((posts: PostInstance[]) => {
                        postId = posts[0].get('id');
                    });
                });
            }).catch(handleError);
    });

    describe('Queries', () => {
        describe('application/json', () => {
            describe('posts', () => {
                it('should return a list of Posts', () => {

                    let body = {
                        query: `
                            query {
                                posts {
                                    title
                                    content
                                    photo
                                }
                            }
                        `
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const postList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postList).to.be.an('array');
                            expect(postList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'author', 'comments']);
                            expect(postList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postList[0].title).to.equal('First Post')
                        }).catch(handleError);

                });
            });

            describe('post', () => {
                it('should return a single Post with your author', () => {
                    let body = {
                        query: `
                            query getPost($id: ID!) {
                                post(id: $id) {
                                    title
                                    author {
                                        name
                                        email
                                    }
                                    comments {
                                        comment
                                    }
                                }
                            }
                        `,
                        variables: {
                            id: postId
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const singlePost = res.body.data.post;
                            expect(res.body.data).to.be.an('object');
                            expect(res.body.data).to.have.key('post')
                            expect(singlePost).to.be.an('object');
                            expect(singlePost).to.have.keys(['title', 'author', 'comments']);
                            expect(singlePost.title).to.equal('First Post');
                            expect(singlePost.author).to.be.an('object').with.keys(['name', 'email']);
                            expect(singlePost.author).to.be.an('object').with.not.keys(['id', 'createdAt', 'updatedAt', 'posts']);
                        }).catch(handleError);
                });
            });
        });

        describe('application/graphql', () => {
            describe('posts', () => {
                it('should return a list of Posts', () => {

                    let query = `
                        query {
                            posts {
                                title
                                content
                                photo
                            }
                        }
                    `;
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .then(res => {
                            const postList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postList).to.be.an('array');
                            expect(postList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'author', 'comments']);
                            expect(postList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postList[0].title).to.equal('First Post')
                        }).catch(handleError);

                });

                it('should paginate a list of Posts', () => {

                    let query = `
                        query getPostsList($first: Int, $offset: Int) {
                            posts(first: $first, offset: $offset) {
                                title
                                content
                                photo
                            }
                        }
                    `;
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/graphql')
                        .send(query)
                        .query({
                            variables: JSON.stringify({
                                first: 2,
                                offset: 1
                            })
                        })
                        .then(res => {
                            const postList = res.body.data.posts;
                            expect(res.body.data).to.be.an('object');
                            expect(postList).to.be.an('array').with.length(2);
                            expect(postList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt', 'author', 'comments']);
                            expect(postList[0]).to.have.keys(['title', 'content', 'photo']);
                            expect(postList[0].title).to.equal('Second Post')
                        }).catch(handleError);

                });
            });
        });
    });

    describe('Mutations', () => {
        describe('application/json', () => {
            describe('createPost', () => {
                it('should create a new post', () => {
                    let body = {
                        query: `
                            mutation createNewPost($input: PostInput!) {
                                createPost(input: $input) {
                                    id
                                    title
                                    content
                                    author {
                                        id
                                        name
                                        email
                                    }
                                }
                            }
                        `,
                        variables: {
                            input: {
                                title: 'Fourth Post',
                                content: 'This is a fourth post',
                                photo: 'fourth_photo'
                            }
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createdPost = res.body.data.createPost;
                            expect(createdPost).to.be.an('object');
                            expect(createdPost).to.have.keys(['id', 'title', 'content', 'author']);
                            expect(createdPost.title).to.equal('Fourth Post');
                            expect(createdPost.content).to.equal('This is a fourth post');
                            expect(parseInt(createdPost.author.id)).to.equal(userId);
                        }).catch(handleError);
                });
            });

            describe('updatePost', () => {
                it('should update an existing post', () => {
                    let body = {
                        query: `
                            mutation updateExistingPost($id: ID!, $input: PostInput!) {
                                updatePost(id: $id, input: $input) {
                                    title
                                    content
                                    photo
                                }
                            }
                        `,
                        variables: {
                            id: postId,
                            input: {
                                title: 'Post changed',
                                content: 'Content changed',
                                photo: 'fourth_photo_2'
                            }
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            const updatedPost = res.body.data.updatePost;
                            expect(updatedPost).to.be.an('object');
                            expect(updatedPost).to.have.keys(['title', 'content', 'photo']);
                            expect(updatedPost.title).to.equal('Post changed');
                            expect(updatedPost.content).to.equal('Content changed');
                            expect(updatedPost.photo).to.equal('fourth_photo_2');
                        }).catch(handleError);
                });
            });


            describe('deletePost', () => {
                it('should delete an existing post', () => {
                    let body = {
                        query: `
                            mutation deleteExistingPost($id: ID!) {
                                deletePost(id: $id)
                            }
                        `,
                        variables: {
                            id: postId
                        }
                    };
                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send(JSON.stringify(body))
                        .then(res => {
                            expect(res.body.data).to.have.key('deletePost');
                            expect(res.body.data.deletePost).to.be.true;
                        }).catch(handleError);
                });
            });
        });
    });
});
