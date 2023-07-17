import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';
import { SetMetadata } from '@nestjs/common';

export const MIN_DATE = 'minDate';

/**
 * Checks if the value is a date that's after the specified date.
 */
export function isAdult(date: unknown, minDate: Date): boolean {
  const dateObject: Date = typeof date === 'string' ? new Date(date) : <Date>date;
  return (dateObject instanceof Date && dateObject.getTime() < minDate.getTime()) || isNaN(dateObject.getTime());
}

/**
 * Checks if the value is a date that's after the specified date.
 */
export function IsAdult(date: Date, validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: MIN_DATE,
      constraints: [date],
      validator: {
        validate: (value, args): boolean => isAdult(value, args.constraints[0]),
        defaultMessage: buildMessage(
          (eachPrefix) => 'minimal allowed date for ' + eachPrefix + '$property is $constraint1',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

export const IS_PUBLIC_KEY = 'isPublic';
export const SkipAuth = () => SetMetadata(IS_PUBLIC_KEY, true);
