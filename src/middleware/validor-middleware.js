import { validationResult } from "express-validator";
import { APiError } from "../utils/api-error.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  const extractedErros = [];

  errors.array().map((error) => {
    extractedErros.push({
      [error.path]: error.msg,
    });
  });

  throw new APiError(402, "Recieved data is not valid", extractedErros);
};

export { validate };
