import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: unknown, { metatype, type }: ArgumentMetadata) {
    if (type === 'custom' && value === undefined) {
      return value;
    }

    if (type === 'query' && (value === null || value === undefined)) {
      return value;
    } else if (value === null || value === undefined) {
      throw new BadRequestException();
    }

    if (
      !metatype ||
      !this.toValidate(
        metatype as
          | ObjectConstructor
          | StringConstructor
          | BooleanConstructor
          | NumberConstructor
          | ArrayConstructor,
      )
    ) {
      return value;
    }

    const object = plainToClass(metatype as Type<object>, value, {
      enableImplicitConversion: true,
    });

    const isWebhookDto = metatype['__ALLOW_EXTRA_FIELDS__'] ? true : false;

    const isEnableWhitelist = isWebhookDto ? false : true;

    const errors = await validate(object, {
      whitelist: isEnableWhitelist,
      forbidNonWhitelisted: isEnableWhitelist,
      forbidUnknownValues: isEnableWhitelist,
    });

    if (errors.length > 0) {
      const firstError = errors[0];
      const message = firstError?.constraints
        ? Object.values(firstError?.constraints).pop()
        : '';

      throw new BadRequestException(message);
    }

    return object;
  }

  private toValidate(
    metatype:
      | ObjectConstructor
      | StringConstructor
      | BooleanConstructor
      | NumberConstructor
      | ArrayConstructor,
  ): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
