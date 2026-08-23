const asyncHandler = (RequestHandler) => {
  return (req, res, next) => {
    Promise.resolve(RequestHandler(req, res, next)).catch((error) => next(err));
  };
};

export { asyncHandler };
