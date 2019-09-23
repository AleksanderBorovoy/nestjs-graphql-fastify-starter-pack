import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';

describe('AppController (e2e)', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new FastifyAdapter());

    await app.init();
    app
      .getHttpAdapter()
      .getInstance()
      .ready();
  });

  const helloQuery = `
  query {
    hello
  }`;
  it('fetch Pokemons', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        query: helloQuery,
      })
      .expect(({ body }) => {
        expect(body.data.hello).toEqual('hello world');
      })
      .expect(200);
  });
});
