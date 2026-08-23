import { APiresponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const healthcheck = asyncHandler(async (req, res) => {
  res.status(200).json(new APiresponse(200, { message: "Server is running" }));
});

export default healthcheck;
