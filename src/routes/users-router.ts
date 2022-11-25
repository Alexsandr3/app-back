import {Response, Router} from "express";
import {SortDirectionType} from "../types/blogs_types";
import {
    preGetUsersValidations,
    usersValidations
} from "../middlewares/users-validation-middleware";
import {checkAutoritionMiddleware} from "../middlewares/check-autorition-middleware";
import {RequestWithBody, RequestWithParams, RequestWithQeury} from "../types/Req_types";
import {QueryParams_GetUsersModel} from "../models/QueryParams_GetUsersModel";
import {UsersViewType} from "../types/users_types";
import {URIParams_UserModel} from "../models/URIParams_UserModel";
import {HTTP_STATUSES} from "../const/HTTP response status codes";
import {PaginatorType} from "../types/PaginatorType";
import {BodyParams_UserInputModel} from "../models/BodyParams_UserInputModel";
import {usersQueryRepositories, usersService} from "../composition-root";


export const usersRoute = Router({})


usersRoute.get('/', preGetUsersValidations, async (req: RequestWithQeury<QueryParams_GetUsersModel>, res: Response<PaginatorType<UsersViewType[]> | null>) => {
    let data = req.query
    let dataForReposit = {
        searchLoginTerm: '',
        searchEmailTerm: '',
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDirection: SortDirectionType.Desc,
        ...data,
    }
    const users = await usersQueryRepositories.findUsers(dataForReposit)
    return res.send(users)
})
usersRoute.post('/', usersValidations, async (req: RequestWithBody<BodyParams_UserInputModel>, res: Response<UsersViewType | null>) => {
    const newUser = await usersService.createUser(req.body.login, req.body.email, req.body.password)
    return res.status(HTTP_STATUSES.CREATED_201).send(newUser)
})
usersRoute.delete('/:id', checkAutoritionMiddleware, async (req: RequestWithParams<URIParams_UserModel>, res: Response) => {
    const id = req.params.id
    const isDelete = await usersService.deleteUserById(id)
    if (!isDelete) {
        return res.sendStatus(HTTP_STATUSES.NOT_FOUND_404)
    } else {
        return res.sendStatus(HTTP_STATUSES.NO_CONTENT_204)
    }
})