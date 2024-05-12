import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Please provide a valid video Id");
  }

  const getComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owners",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          // $arrayEleAt: ["$owners", 0],
          //   alternative
          $first: "$owners",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCount: 1,
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
        isLiked: 1,
      },
    },
  ]);

  if (!getComments) {
    throw new ApiError(500, "Error while loading getComments section");
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const comments = await Comment.aggregatePaginate(getComments, options);

  if (!comments) {
    throw new ApiError(500, "Error while loading comments section");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully!"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is not valid");
  }

  if (!content) {
    throw new ApiError(400, "Content not provided");
  }

  const uploadComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!uploadComment) {
    throw new ApiError(500, "Failed to upload the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uploadComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  if (!content) {
    throw new ApiError(400, "No comment provided");
  }

  const getComment = await Comment.findById(commentId);

  if (req.user?._id.toString() !== getComment?.owner.toString()) {
    throw new ApiError(400, "User is not the owner of this comment");
  }

  const uploadComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  if (!uploadComment) {
    throw new ApiError(500, "Failed to update comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        uploadComment,
        "Comment has been updated Successfully"
      )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const getComment = await Comment.findById(commentId);

  if (!getComment) {
    throw new ApiError(400, "Comment does not exist");
  }

  if (getComment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "User is not the owner of this comment");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "Unable to delete the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
