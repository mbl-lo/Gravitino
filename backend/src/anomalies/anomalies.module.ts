import { Module } from '@nestjs/common';
import { AnomaliesService } from './anomalies.service';

@Module({
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule {}
