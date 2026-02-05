import { Module, Global } from '@nestjs/common';
import { DataAccessLayer } from './data-access.layer';

@Global()
@Module({
  providers: [DataAccessLayer],
  exports: [DataAccessLayer],
})
export class DatabaseModule {}
