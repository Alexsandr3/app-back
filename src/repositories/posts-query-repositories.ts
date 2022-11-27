import {ObjectId} from "mongodb";
import {
    ExtendedLikesInfoViewModel,
    ForFindPostsType, LikeDetailsViewModel,
    LikesPostsDBType,
    PostsDBType,
    PostsViewType
} from "../types/posts_types";
import {PaginatorType} from "../types/PaginatorType";
import {PaginatorPostsBlogType} from "../types/blogs_types";
import {CommentsDBType, CommentsViewType, LikesInfoViewModel, LikeStatusType} from "../types/comments_types";
import {CommentModelClass, LikeModelClass, LikePostModelClass, PostModelClass} from "./schemas";
import {PayloadType} from "../types/payloadType";


export class PostsQueryRepositories {
    private async commentWithNewId(comment: CommentsDBType, userId: string | null): Promise<CommentsViewType | null> {
        let myStatus: string = LikeStatusType.None
        if (userId) {
            const result = await LikeModelClass.findOne({userId: userId, parentId: comment._id})
            if (result) {
                myStatus = result.likeStatus
            }
        }
        const totalCountLike = await LikeModelClass.countDocuments({parentId: comment._id, likeStatus: "Like"})
        const totalCountDislike = await LikeModelClass.countDocuments({parentId: comment._id, likeStatus: "Dislike"})
        const likesInfo = new LikesInfoViewModel(
            totalCountLike,
            totalCountDislike,
            myStatus)
        return new CommentsViewType(
            comment._id?.toString(),
            comment.content,
            comment.userId,
            comment.userLogin,
            comment.createdAt,
            likesInfo)
    }

    private LikeDetailsView(object: LikesPostsDBType): LikeDetailsViewModel {
        return new LikeDetailsViewModel(
            object.addedAt,
            object.userId,
            object.login
        )
    }

    async postForView(post: PostsDBType, user: PayloadType): Promise<PostsViewType> {
        let myStatus: string = LikeStatusType.None
        if (user.userId) {
            const result = await LikePostModelClass.findOne({userId: user.userId, parentId: post._id})
            if (result) {
                myStatus = result.likeStatus
            }
        }
        const totalCountLike = await LikePostModelClass.countDocuments({parentId: post._id, likeStatus: "Like"})
        const totalCountDislike = await LikePostModelClass.countDocuments({parentId: post._id, likeStatus: "Dislike"})
        const newestLikes = (await LikePostModelClass
            .find({parentId: post._id, likeStatus: "Like"})
            .sort({addedAt: "desc"})
            .limit(3)
            .lean())
            .map(newestLikes => this.LikeDetailsView(newestLikes))
        const extendedLikesInfo = new ExtendedLikesInfoViewModel(
            totalCountLike,
            totalCountDislike,
            myStatus,
            newestLikes
        )
        return new PostsViewType(
            post._id.toString(),
            post.title,
            post.shortDescription,
            post.content,
            post.blogId,
            post.blogName,
            post.createdAt,
            extendedLikesInfo
        )
    }

    async findByIdPost(id: string, user: PayloadType): Promise<PostsViewType | null> {
        if (!ObjectId.isValid(id)) {
            return null
        }
        const post = await PostModelClass.findOne({_id: new ObjectId(id)})
        if (!post) {
            return null
        } else {
            return this.postForView(post, user)
            //return postWithNewId(result)
        }
    }

    async findPosts(data: ForFindPostsType, user: PayloadType, blogId?: string): Promise<PaginatorType<PostsViewType[]>> {
        const foundPosts = await PostModelClass
            .find({})
            .skip((data.pageNumber - 1) * data.pageSize)
            .limit(data.pageSize)
            .sort({[data.sortBy]: data.sortDirection})
            .lean()
        const mappedPosts = foundPosts.map(async post => await this.postForView(post, user))
        const itemsPosts = await Promise.all(mappedPosts)
        const totalCount = await PostModelClass.countDocuments(blogId ? {blogId} : {})
        const pagesCountRes = Math.ceil(totalCount / data.pageSize)
        return new PaginatorType(
            pagesCountRes,
            data.pageNumber,
            data.pageSize,
            totalCount,
            itemsPosts
        )

    }

    async findCommentsByIdPost(postId: string, data: PaginatorPostsBlogType, user: PayloadType) {
        const post = await this.findByIdPost(postId, user)
        if (!post) return null
        const comments = await CommentModelClass.find({postId: postId})
            .skip((data.pageNumber - 1) * data.pageSize)
            .limit(data.pageSize)
            .sort({[data.sortBy]: data.sortDirection}).lean()
        const mappedComments = comments.map(async comment => await this.commentWithNewId(comment, user.userId))
        const itemsComments = await Promise.all(mappedComments)
        // if (!comments) return null
        const totalCountComments = await CommentModelClass.countDocuments(postId ? {postId} : {})
        const pagesCountRes = Math.ceil(totalCountComments / data.pageSize)
        return new PaginatorType(
            pagesCountRes,
            data.pageNumber,
            data.pageSize,
            totalCountComments,
            itemsComments
        )
    }
}