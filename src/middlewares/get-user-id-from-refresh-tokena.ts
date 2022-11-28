import {NextFunction, Request, Response} from "express";
import {jwtService} from "../application/jwt-servise";
import {PayloadType} from "../types/payloadType";



export const getUserIdFromRefreshTokena = async (req: Request, res: Response, next: NextFunction) => {
    //let  user = null
    if (!req.cookies.refreshToken) {
        req.user = null
    } else {
        const foundUser: PayloadType = await jwtService.verifyToken(req.cookies.refreshToken)
        if (foundUser) req.user = foundUser
    }
    next()
}
