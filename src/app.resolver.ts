import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query()
  hello() {
    return 'hello world';
  }
}
