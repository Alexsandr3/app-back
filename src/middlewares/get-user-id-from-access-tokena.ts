import {NextFunction, Request, Response} from "express";
import {jwtService} from "../application/jwt-servise";


export const getUserIdFromAccessTokena = async (req: Request, res: Response, next: NextFunction) => {
    //let user = null
    if (!req.headers.authorization) {
       req.userId = null
    } else {
        const token = req.headers.authorization.split(' ')[1]
        const foundUserId = await jwtService.getUserIdByToken(token)
        if (foundUserId)  req.userId = foundUserId
    }
    next()
}
