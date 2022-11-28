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

    private async LikeDetailsView(object: LikesPostsDBType): Promise<LikeDetailsViewModel> {
        return new LikeDetailsViewModel(
            object.addedAt,
            object.userId,
            object.login
        )
    }

    async _postForView(post: PostsDBType, userId: string | null): Promise<PostsViewType> {
        let myStatus: string = LikeStatusType.None
        if (userId) {
            const result = await LikePostModelClass.findOne({userId: userId, parentId: post._id})
            if (result) {
                myStatus = result.likeStatus
            }
        }
        const totalCountLike = await LikePostModelClass.countDocuments({parentId: post._id, likeStatus: "Like"})
        const totalCountDislike = await LikePostModelClass.countDocuments({parentId: post._id, likeStatus: "Dislike"})
        const newestLikes = await LikePostModelClass
            .find({parentId: post._id.toString(), likeStatus: "Like"})
            .sort({addedAt: "desc"})
            .limit(3)
            .lean()
        const mappedNewestLikes = newestLikes.map(async like => await this.LikeDetailsView(like))
        const itemsLikes = await Promise.all(mappedNewestLikes)
        const extendedLikesInfo = new ExtendedLikesInfoViewModel(
            totalCountLike,
            totalCountDislike,
            myStatus,
            itemsLikes
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

    async findByIdPost(id: string, userId: string | null): Promise<PostsViewType | null> {
        if (!ObjectId.isValid(id)) {
            return null
        }
        const post = await PostModelClass.findOne({_id: new ObjectId(id)})
        if (!post) {
            return null
        } else {
            return this._postForView(post, userId)
        }
    }

    async findPosts(data: ForFindPostsType, userId: string | null, blogId?: string): Promise<PaginatorType<PostsViewType[]>> {
        const foundPosts = await PostModelClass
            .find({})
            .skip((data.pageNumber - 1) * data.pageSize)
            .limit(data.pageSize)
            .sort({[data.sortBy]: data.sortDirection})
            .lean()
        const mappedPosts = foundPosts.map(async post => await this._postForView(post, userId))
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

    async findCommentsByIdPost(postId: string, data: PaginatorPostsBlogType, userId: string | null) {
        const post = await this.findByIdPost(postId, userId)
        if (!post) return null
        const comments = await CommentModelClass.find({postId: postId})
            .skip((data.pageNumber - 1) * data.pageSize)
            .limit(data.pageSize)
            .sort({[data.sortBy]: data.sortDirection}).lean()
        const mappedComments = comments.map(async comment => await this.commentWithNewId(comment, userId))
        const itemsComments = await Promise.all(mappedComments)
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