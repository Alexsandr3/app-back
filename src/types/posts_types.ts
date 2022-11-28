import {PaginatorBlogType} from "./blogs_types";
import {ObjectId} from "mongodb";

export class PostsViewType {
    constructor(public id: string,
                public title: string,
                public shortDescription: string,
                public content: string,
                public blogId: string,
                public blogName: string,
                public createdAt: string,
                public extendedLikesInfo: ExtendedLikesInfoViewModel) {
    }
}

export class PostsDBType {
    constructor(public _id: ObjectId,
                public title: string,
                public shortDescription: string,
                public content: string,
                public blogId: string,
                public blogName: string,
                public createdAt: string) {
    }
}

export type ForFindPostsType = Omit<PaginatorBlogType, "searchNameTerm">

export class ExtendedLikesInfoViewModel {
    constructor(
        public likesCount: number,
        public dislikesCount: number,
        public myStatus: string,
        public newestLikes: Array<LikeDetailsViewModel>
    ) {
    }
}

export class LikeDetailsViewModel {
    constructor(
        public addedAt: string,
        public userId: string,
        public login: string
    ) {
    }
}

export class LikesPostsDBType {
    constructor(public _id: ObjectId,
                public addedAt: string,
                public userId: string,
                public parentId: string,
                public login: string,
                public likeStatus: string,
               ) {
    }
}

