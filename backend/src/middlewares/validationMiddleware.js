const ApiError = require('../utils/ApiError');
const { ERROR_CODES } = require('../utils/constants');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // Override with parsed/sanitized data
      next();
    } catch (error) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      next(new ApiError(400, 'Validation Error', errors, true, ERROR_CODES.VALIDATION_ERROR));
    }
  };
};

module.exports = validate;
