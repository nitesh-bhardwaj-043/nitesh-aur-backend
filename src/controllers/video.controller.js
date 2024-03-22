import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { userId } = req.user?._id;

  if (!(title && description)) {
    throw new ApiError(
      400,
      "Please provide a valid video title and description"
    );
  }
  if (!userId) {
    throw new ApiError(400, "User not authenticated");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is missing");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(videoLocalPath);

  const uploadVideo = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: userId,
    duration: videoFile.duration,
  });

  if (!uploadVideo) {
    throw new ApiError(
      500,
      "Something went wrong while saving the video to database"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uploadVideo, "Video is uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is not provided");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.isPublished === false) {
    throw new ApiError(400, "Video is not published");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video details are fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (videoId) {
    throw new ApiError(400, "Video Id not provided");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const { title, description, isPublished } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!title || !description || !isPublished) {
    throw new ApiError(400, "ALl three fields are required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is not missing");
  }

  const oldThumbnail = videoId.thumbnail;
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(500, "Error while uploading on cloudinary");
  }

  await deleteImageFromCloudinary(oldThumbnail);

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        isPublished,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(500, "Video not found after updating the details");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is not provided");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findByIdAndDelete(videoId);
  if (!video) {
    throw new ApiError(400, "No video with given id exists.");
  }

  await deleteImageFromCloudinary(video.videoFile);
  await deleteImageFromCloudinary(video.thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(video);
  if (!deletedVideo) {
    throw new ApiError(500, "Error in  deleting the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id is not provided");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const togglePublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  if (!togglePublish) {
    throw new ApiError(500, "Unable to toggle the published section");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, togglePublish, "isPublished is successfully toggled")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
