import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMonitorDto {
  @ApiProperty({ example: 'Portfolio', description: 'Human-friendly name' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'https://sergiorodas.vercel.app' })
  @IsUrl({ require_protocol: true })
  url: string;

  @ApiPropertyOptional({ example: 'GET', default: 'GET' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({
    example: 200,
    default: 200,
    description: 'HTTP status code considered healthy',
  })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  expectedStatus?: number;

  @ApiPropertyOptional({
    example: 300,
    default: 300,
    description: 'How often to probe it, in seconds',
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(86_400)
  intervalSeconds?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
