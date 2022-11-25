import {UserModelClass} from "./schemas";
import {ObjectId} from "mongodb";
import {UsersAcountDBType, UsersViewType} from "../types/users_types";
import {userWithNewId} from "./users-query-repositories";


export class UsersRepositories {
    async createUser(newUser: UsersAcountDBType): Promise<UsersViewType> {
        await UserModelClass.create(newUser)
        return userWithNewId(newUser)
    }

    async deleteUser(_id: ObjectId) {
        return UserModelClass.deleteOne({_id: _id})
    }

    async deleteUserById(id: string): Promise<boolean> {
        if (!ObjectId.isValid(id)) {
            return false
        }
        const result = await UserModelClass.deleteOne({_id: new ObjectId(id)})
        return result.deletedCount === 1
    }

    async findByLoginOrEmail(loginOrEmail: string): Promise<UsersAcountDBType | null> {
        return UserModelClass.findOne({$or: [{"accountData.email": loginOrEmail}, {"accountData.login": loginOrEmail}]});
    }

    async findUserByConfirmationCode(confirmationCode: string): Promise<UsersAcountDBType | null> {
        return UserModelClass.findOne({'emailConfirmation.confirmationCode': confirmationCode})
    }

    async findUserByRecoveryCode(recoveryCode: string): Promise<UsersAcountDBType | null> {
        return UserModelClass.findOne({'emailRecovery.recoveryCode': recoveryCode})
    }

    async updateConfirmation(_id: ObjectId): Promise<boolean> {
        const result = await UserModelClass.updateOne({_id: _id}, {$set: {'emailConfirmation.isConfirmation': true}})
        return result.modifiedCount === 1
    }

    async updateRecovery(_id: ObjectId, passwordHash: string): Promise<boolean> {
        const result = await UserModelClass.updateOne({_id: _id}, {
            $set: {
                'accountData.passwordHash': passwordHash,
                'emailRecovery.isConfirmation': true
            }
        })
        return result.modifiedCount === 1
    }

    async updateCodeConfirmation(_id: ObjectId, code: string, expirationDate: Date): Promise<boolean> {
        const result = await UserModelClass.updateOne({_id: _id}, {
            $set: {
                'emailConfirmation.confirmationCode': code,
                "emailConfirmation.expirationDate": expirationDate
            }
        })
        return result.modifiedCount === 1
    }

    async updateCodeRecovery(_id: ObjectId, code: string, expirationDate: Date): Promise<boolean> {
        const result = await UserModelClass.updateOne({_id: _id}, {
            $set: {
                'emailRecovery.recoveryCode': code,
                "emailRecovery.expirationDate": expirationDate
            }
        })
        return result.modifiedCount === 1
    }
}
