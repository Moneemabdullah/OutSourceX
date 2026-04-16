import { Role } from "../../generated/prisma/enums";
import { IRequestUser } from "./requestUser.interface";

declare global {
    namespace Express {
        interface Request {
            user?: IRequestUser;
        }
    }
}
