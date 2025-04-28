import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    console.log(data);
    const request = ctx.switchToHttp().getRequest();
    return request.user ? request.user[data] : null;
  },
);
