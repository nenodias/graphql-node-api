import { db, chai, app, handleError, expect, jwt } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';
import { JWT_SECRET } from '../../../src/utils/utils';

describe('Token', () => {

    let token: string;
    let userId: number;

    beforeEach(() => {
        const condicao = { where: {} };
        return db.Comment.destroy(condicao)
            .then((rows: number) => db.Post.destroy(condicao))
            .then((rows: number) => db.User.destroy(condicao))
            .then((rows: number) => {
                return db.User.create({
                        name: 'Peter Quill',
                        email: 'peter@guardians.com',
                        password: '1234'
                    }).then((users: UserInstance) => {
                    userId = users.get('id');
                    const payload = { sub: userId };
                    token = jwt.sign(payload, JWT_SECRET);
                });
            }).catch(handleError);
    });

    describe('Mutations', () => {
        describe('application/json', () => {
            describe('createToken', () => {
                it('should return a new valid token', () => {
                    let body = {
                        query: `
                            mutation createNewToken($email: String!, $password: String!){
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'peter@guardians.com',
                            password: '1234'
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createToken = res.body.data.createToken;
                            expect(res.body.data).to.be.an('object');
                            expect(res.body.data).to.have.key('createToken');
                            expect(createToken).to.have.key('token');
                            expect(createToken.token).to.be.string;
                            expect(res.body.errors).to.be.undefined;
                        }).catch(handleError);
                });

                it('should return an error if the password is incorrect', () => {
                    let body = {
                        query: `
                            mutation createNewToken($email: String!, $password: String!){
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'peter@guardians.com',
                            password: 'WORNG_PASSWORD'
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createToken = res.body.data.createToken;
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.data).to.have.key('createToken');
                            expect(createToken).to.be.null;
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body.errors[0].message).to.be.equal('Unauthorized, wrong wmail or password!');
                        }).catch(handleError);
                });

                it('should return an error if the email not exist', () => {
                    let body = {
                        query: `
                            mutation createNewToken($email: String!, $password: String!){
                                createToken(email: $email, password: $password) {
                                    token
                                }
                            }
                        `,
                        variables: {
                            email: 'ronan@guardians.com',
                            password: '1234'
                        }
                    };

                    return chai.request(app)
                        .post('/graphql')
                        .set('content-type', 'application/json')
                        .send(JSON.stringify(body))
                        .then(res => {
                            const createToken = res.body.data.createToken;
                            expect(res.body).to.have.keys(['data', 'errors']);
                            expect(res.body.data).to.have.key('createToken');
                            expect(createToken).to.be.null;
                            expect(res.body.errors).to.be.an('array');
                            expect(res.body.errors[0].message).to.be.equal('Unauthorized, wrong wmail or password!');
                        }).catch(handleError);
                });
            });
        });
    });
});