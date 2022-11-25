import {Request, Response, Router} from "express";
import {HTTP_STATUSES} from "../const/HTTP response status codes";
import {checkRefreshTokena} from "../middlewares/check-refresh-tokena";
import {DeviceViewModel} from "../types/device_types";
import {validDeviceId} from "../middlewares/valid-device-Id";
import {deviceQueryRepositories, deviceService} from "../composition-root";


export const securityRoute = Router({})


securityRoute.get('/devices', checkRefreshTokena, async (req: Request, res: Response<DeviceViewModel[] | null>) => {
   const devices = await deviceQueryRepositories.findDevices(req.payload.userId)
   if (devices) {
      return res.send(devices).status(HTTP_STATUSES.OK_200)
   } else {
      return res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401)
   }
})
securityRoute.delete('/devices', checkRefreshTokena, async (req: Request, res: Response<boolean>) => {
   const isDeleted = await deviceService.deleteDevices(req.payload)
   if (isDeleted) {
      return res.sendStatus(HTTP_STATUSES.NO_CONTENT_204)
   } else {
      return res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401)
   }
})
securityRoute.delete('/devices/:id', validDeviceId, checkRefreshTokena, async (req: Request, res: Response<boolean>) => {
   const {deviceId, userId } = req.payload
   const isDeleted = await deviceService.deleteByDeviceId(req.params.id, deviceId, userId)
   if (isDeleted) {
      return res.sendStatus(HTTP_STATUSES.NO_CONTENT_204)
   } else {
      return res.sendStatus(HTTP_STATUSES.FORBIDDEN_403)
   }
})