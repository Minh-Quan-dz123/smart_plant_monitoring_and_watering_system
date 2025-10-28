import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorator/decorator';

/**
 * Guard này dùng để xác thực JWT token.
 * Nó sẽ:
 *  - Bỏ qua route có @Public()
 *  - Kiểm tra token hợp lệ
 *  - Nếu hợp lệ → gắn user payload vào req.user
 *  - Nếu sai → throw UnauthorizedException
 */
@Injectable()
export class AuthGuard extends NestAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // kiểm tra xem route có decorator @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu là public route → bỏ qua guard
    if (isPublic) {
      return true;
    }

    // Nếu không phải public route → chạy JWT guard mặc định
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Nếu có lỗi hoặc không có user → ném lỗi 401
    if (err || !user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Trả user về cho controller
    return user;
  }
}
