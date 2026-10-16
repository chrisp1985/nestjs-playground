import Joi from 'joi';

// Checked once at startup: the app refuses to boot if a required variable is
// missing or malformed, rather than failing on first use.
export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(8082),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
});
