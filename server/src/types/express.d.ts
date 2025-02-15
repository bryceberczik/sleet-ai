import { JwtPayload } from "jsonwebtoken";

// Added type JwtPayload from @types/jsonwebtoken to the Request "type collection".

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}
