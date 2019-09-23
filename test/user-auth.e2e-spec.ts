import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../src/config/typeorm.config';
import { GraphQLModule } from '@nestjs/graphql';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SignCredentialsDto } from 'src/auth/dto/sign-credentials.dto';
import { MailerModule, HandlebarsAdapter } from '@nest-modules/mailer';
jest.mock('@nestjs/common/services/logger.service');
describe('AuthController (e2e)', () => {
  let app;
  let authToken;
  const user = {
    username: 'testUsername',
    email: 'testEmail@gmail.com',
    password: 'TestPassword13',
  };
  const wrongEmail = 'WrongEmail@mail.com';
  const wrongPassword = '321WrongPassword';
  const newUserPassword = 'NewUserPasswrd890';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        TypeOrmModule.forRoot(typeOrmConfig),
        MailerModule.forRoot({
          transport: `smtps://${process.env.email}:${
            process.env.gmailPW
          }@smtp.gmail.com`,
          defaults: {
            from: `"Subject" <${process.env.email}>`,
          },
          template: {
            dir: __dirname + '/templates',
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        }),
        GraphQLModule.forRoot({
          typePaths: ['./**/*.graphql'],
          context: ({ req }) => ({ headers: req.headers }),
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication(
      // remove this adapter if using Express Server
      new FastifyAdapter(),
      // remove this adapter if using Express Server
    );
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    app
      .getHttpAdapter()
      .getInstance()
      .ready();
  });
  afterAll(async () => {
    await app.close();
  });

  function createObj(data) {
    return JSON.stringify(data).replace(/\"([^(\")"]+)\":/g, '$1:');
  }

  describe('sign up behaviour', () => {
    const createUserData = `
      mutation {
       createUser(data: ${createObj(user)}){
         id
         username
         email
         password
       }
      }`;
    it('signs up a new user', async () => {
      return await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          query: createUserData,
        })
        .expect(({ body }) => {
          const data = body.data.createUser;
          expect(data.username).toBe(user.username);
        });
    });

    it('it cannot sign up with duplicate email', async () => {
      return await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          query: createUserData,
        })
        .expect(({ body }) => {
          expect(body.errors[0].extensions.code).toEqual(
            'INTERNAL_SERVER_ERROR',
          );
        });
    });
    const weakPasswordUser = {
      username: user.username,
      email: user.email,
      password: wrongPassword,
    };
    const weakPasswordData = `
    mutation {
     createUser(data: ${createObj(weakPasswordUser)}){
       id
       username
       email
       password
     }
    }`;
    it('cannot sign up with weak password', async () => {
      return await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          query: weakPasswordData,
        })
        .expect(({ body }) => {
          expect(body.errors[0].extensions.code).toEqual(
            'INTERNAL_SERVER_ERROR',
          );
        });
    });
  });
  describe('sign in behaviour', () => {
    const signInData = {
      email: user.email,
      password: user.password,
    };
    const signInMutationQuery = `
      mutation {
        signIn(data: ${createObj(signInData)})
      }
    `;
    it('can sign in with credentials', async () => {
      return await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          query: signInMutationQuery,
        })
        .expect(({ body }) => {
          authToken = body.data.signIn;

          expect(body.data.signIn).not.toBeNull();
        });
    });
    const wrongEmailData = {
      email: wrongEmail,
      password: user.password,
    };
    const signInWrongEmailMutationQuery = `
    mutation {
      signIn(data: ${createObj(wrongEmailData)})
    }
    `;
    it('cannot sign in with nonexistent email', async () => {
      return await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationaName: null,
          query: signInWrongEmailMutationQuery,
        })
        .expect(({ body }) => {
          expect(body.errors[0].message.statusCode).toEqual(401);
        });
    });
    const wrongPasswordData: SignCredentialsDto = {
      email: user.email,
      password: wrongPassword,
    };

    const signInWrongPasswordMutationQuery = `
    mutation {
      signIn(data: ${createObj(wrongPasswordData)})
    }
    `;
    it('cannot sign in with wrong password', async () => {
      return await request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationaName: null,
          query: signInWrongPasswordMutationQuery,
        })
        .expect(({ body }) => {
          expect(body.errors[0].message.statusCode).toEqual(401);
        });
    });
  });
  describe('change password behaviour', () => {
    const changePasswordData = {
      password: user.password,
      newpassword: newUserPassword,
    };
    const changePasswordQuery = `
    mutation {
      changePassword(data: ${createObj(changePasswordData)}) {
        id
        username
        email
        password
      }
    }
    `;
    it('should allow users to change their password', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .set({
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        })
        .send({
          operationName: null,
          query: changePasswordQuery,
        })
        .expect(({ body }) => {
          const data = body.data.changePassword;
          expect(data.username).toBe(user.username);
          expect(data.email).toBe(user.email);
        });
    });

    const forgotPasswordQuery = `
    mutation {
      forgotPassword(data: {email: "${user.email}"})
    }
    `;
    it('should allow users to reset their password', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: null,
          query: forgotPasswordQuery,
        })
        .expect(({ body }) => {
          expect(body.data.forgotPassword).toEqual(
            'reset password link has been sent',
          );
        });
    });
  });
});
