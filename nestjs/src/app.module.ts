import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { PostsModule } from './posts/posts.module.js';

@Module({
  imports: [PrismaModule, PostsModule],
})
export class AppModule {}
