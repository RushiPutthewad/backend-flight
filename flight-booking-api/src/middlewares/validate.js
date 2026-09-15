const ApiError = require('../utils/api-error');

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      ...req.body,
      ...req.query,
      ...req.params
    });

    if (!result.success) {
      const details = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return next(ApiError.validationError('Validation failed', details));
    }

    // Replace request data with validated & sanitized values
    req.validatedData = result.data;
    next();
  };
};

module.exports = validate;