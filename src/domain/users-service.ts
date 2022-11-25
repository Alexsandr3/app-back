import {UsersAcountDBType, UsersViewType} from "../types/users_types";
import bcrypt from 'bcrypt'
import {UsersRepositories} from "../repositories/users-db-repositories";
import {jwtService} from "../application/jwt-servise";
import {v4 as uuidv4} from 'uuid'
import add from 'date-fns/add'
import {ObjectId} from "mongodb";
import {emailManagers} from "../managers/email-managers";
import {DeviceRepositories, PayloadType} from "../repositories/device-db-repositories";
import {randomUUID} from "crypto";
import {TokensType} from "../types/token_types";

export class UsersService {

    constructor(protected usersRepositories: UsersRepositories, protected deviceRepositories: DeviceRepositories) {}

    async createUser(login: string, email: string, password: string): Promise<UsersViewType | null> {
        const passwordHash = await this._generateHash(password)
        const user = new UsersAcountDBType (
            new ObjectId(),
            {
                login,
                email,
                passwordHash,
                createdAt: new Date().toISOString()
            },
            {
                confirmationCode: uuidv4(),
                expirationDate: add(new Date(), {
                    hours: 1
                }),
                isConfirmation: false,
                sentEmails: [{
                    sentDate: new Date()
                }]
            },
            {
                recoveryCode: randomUUID(),
                expirationDate: add(new Date(), {
                    hours: 1
                }),
                isConfirmation: false,
                sentEmails: [{
                    sentDate: new Date()
                }]
            })
        const newUser = await this.usersRepositories.createUser(user)
        try {
            await emailManagers.sendEmailConfirmation(newUser.email, user.emailConfirmation.confirmationCode)
        } catch (error) {
            console.error(error)
            await this.usersRepositories.deleteUser(user._id)
            return null
        }
        return newUser
    }
    async deleteUserById(id: string): Promise<boolean> {
        return this.usersRepositories.deleteUserById(id)
    }
    async login(loginOrEmail: string, password: string, ipAddress: string, deviceName: string): Promise<TokensType | null> {
        const user: any = await this.usersRepositories.findByLoginOrEmail(loginOrEmail)
        if (!user) return null;
        const result = await this._compareHash(password, user.accountData.passwordHash)
        if (!result) return null;
        const deviceId = randomUUID()
        const userId = user._id.toString()
        const token = await jwtService.createJwt(userId, deviceId)
        const payloadNew = await jwtService.verifyToken(token.refreshToken)
        await this.deviceRepositories.createDevice(userId, ipAddress, deviceName, deviceId, payloadNew.exp, payloadNew.iat)
        return token
    }
    async refreshToken(payload: PayloadType) {
        const newTokens = await jwtService.createJwt(payload.userId, payload.deviceId)
        const payloadNew = await jwtService.verifyToken(newTokens.refreshToken)
        const updateDevice = await this.deviceRepositories.updateDateDevice(payloadNew, payload.iat)
        if (!updateDevice) return null
        return newTokens
    }
    async verifyTokenForDeleteDevice(payload: PayloadType) {
        const device = await this.deviceRepositories.findDeviceForDelete(payload)
        if (!device) return null
        const isDeleted = await this.deviceRepositories.deleteDevice(payload)
        if (!isDeleted) return null
        return true
    }
    async _generateHash(password: string) {
        return await bcrypt.hash(password, 10)
    }
    async _compareHash(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash)
    }
    async confirmByCode(code: string): Promise<boolean> {
        const user = await this.usersRepositories.findUserByConfirmationCode(code)
        if (!user) return false
        if (user.emailConfirmation.isConfirmation) return false;
        if (user.emailConfirmation.confirmationCode !== code) return false;
        if (user.emailConfirmation.expirationDate < new Date()) return false;
        return await this.usersRepositories.updateConfirmation(user._id)
    }
    async recoveryByCode(newPassword: string, code: string): Promise<boolean> {
        const user = await this.usersRepositories.findUserByRecoveryCode(code)
        if (!user) return false
        if (user.emailRecovery.isConfirmation) return false;
        if (user.emailRecovery.recoveryCode !== code) return false;
        if (user.emailConfirmation.expirationDate < new Date()) return false;
        const passwordHash = await this._generateHash(newPassword)
        return await this.usersRepositories.updateRecovery(user._id, passwordHash)
    }
    async resendingEmail(email: string) {
        const user = await this.usersRepositories.findByLoginOrEmail(email)
        if (!user) return false;
        if (user.emailConfirmation.isConfirmation) return false;
        if (user.emailConfirmation.expirationDate < new Date()) return false;
        const code: any = {
            emailConfirmation: {
                confirmationCode: uuidv4(),
                expirationDate: add(new Date(), {
                    hours: 1
                })
            }
        }
        const newUser = await this.usersRepositories.updateCodeConfirmation(user._id, code.emailConfirmation.confirmationCode, code.emailConfirmation.expirationDate)
        try {
            await emailManagers.sendEmailRecoveryMessage(user.accountData.email, code.emailConfirmation.confirmationCode)
        } catch (error) {
            console.error(error)
            return null
        }
        return newUser
    }
    async recoveryEmail(email: string) {
        const user = await this.usersRepositories.findByLoginOrEmail(email)
        if (!user) return true;
        if (user.emailConfirmation.isConfirmation) return false;
        if (user.emailConfirmation.expirationDate < new Date()) return false;
        const code: any = {
            emailRecovery: {
                recoveryCode: randomUUID(),
                expirationDate: add(new Date(), {
                    hours: 1
                })
            }
        }
        const newUser = await this.usersRepositories.updateCodeRecovery(user._id, code.emailRecovery.recoveryCode, code.emailRecovery.expirationDate)
        try {
            await emailManagers.sendPasswordRecoveryMessage(user.accountData.email, code.emailRecovery.recoveryCode)
        } catch (error) {
            console.error(error)
            return null
        }
        return newUser
    }
}
