import {LikePostModelClass, PostModelClass} from "./schemas";
import {ObjectId} from "mongodb";
import {
    ExtendedLikesInfoViewModel,
    LikeDetailsViewModel,
    LikesPostsDBType,
    PostsDBType,
    PostsViewType
} from "../types/posts_types";
import {blogsQueryRepositories} from "../composition-root";
import {LikeStatusType} from "../types/comments_types";


export class PostsRepositories {
    private LikeDetailsView(object: LikesPostsDBType): LikeDetailsViewModel {
        return new LikeDetailsViewModel(
            object.addedAt,
            object.userId,
            object.login
        )
    }

    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<PostsViewType | null> {
        const blog = await blogsQueryRepositories.findBlogById(blogId)
        if (!blog) {
            return null
        }
        const newPost = new PostsDBType(
            new ObjectId(),
            title,
            shortDescription,
            content,
            blogId,
            blog.name,
            new Date().toISOString())
        const post = await PostModelClass.create(newPost)
        if (!post) return null
        const postId = post._id.toString()
        const newestLikes = (await LikePostModelClass
            .find({parentId: postId, likeStatus: "Like"})
            .sort({addedAt: "desc"})
            .limit(3)
            .lean())
            .map(newestLikes => this.LikeDetailsView(newestLikes))
        const extendedLikesInfo = new ExtendedLikesInfoViewModel(
            0,
            0,
            LikeStatusType.None,
            newestLikes
        )
        return new PostsViewType(
            post._id?.toString(),
            post.title,
            post.shortDescription,
            post.content,
            post.blogId,
            post.blogName,
            post.createdAt,
            extendedLikesInfo
        )
    }

    async updatePostById(id: string, title: string, shortDescription: string, content: string, blogId: string): Promise<boolean> {
        if (!ObjectId.isValid(id)) {
            return false
        }
        const result = await PostModelClass.updateOne({_id: new ObjectId(id)}, {
            $set: {
                title: title,
                shortDescription: shortDescription,
                content: content,
                blogId: blogId
            }
        })
        return result.matchedCount === 1
    }

    async deletePostById(id: string): Promise<boolean> {
        if (!ObjectId.isValid(id)) {
            return false
        }
        const result = await PostModelClass.deleteOne({_id: new ObjectId(id)})
        return result.deletedCount !== 0
    }

    async findPost(id: string): Promise<PostsDBType | null> {
        const post = await PostModelClass.findOne({_id: new ObjectId(id)})
        if (!post) return null
        return post
    }

     async updateStatusPostById(id: string, userId: string, likeStatus: LikeStatusType): Promise<boolean> {
         try {
             await LikePostModelClass.updateOne(
                 {userId: userId, parentId: id},
                 {$set: {likeStatus}},
                 {upsert: true})
             return true
         } catch (error) {
             return false
         }
     }
}

