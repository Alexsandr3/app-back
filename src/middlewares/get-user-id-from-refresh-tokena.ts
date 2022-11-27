import {NextFunction, Request, Response} from "express";
import {jwtService} from "../application/jwt-servise";
import {PayloadType} from "../types/payloadType";



export const getUserIdFromRefreshTokena = async (req: Request, res: Response, next: NextFunction) => {
    let  userId = null
    if (!req.cookies.refreshToken) {
        userId = null
    } else {
        const foundUser: PayloadType = await jwtService.verifyToken(req.cookies.refreshToken)
        if (foundUser) req.user = foundUser
    }
    next()
}
