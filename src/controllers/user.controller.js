import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  // get all details from frontend
  // validation - not empty
  // check if user already exists - by username or email
  // check for image , check for avatar
  // upload image link to the cloudinary - avatar , coverImage
  // create a new user in db
  // remove user password and refreshToken field from response
  // check for new creation
  // return res

  const { username, email, fullName, password } = req.body;
  console.log(
    "name is ",
    fullName,
    " username is  ",
    username,
    " and email is ",
    email,
    " password is ",
    password
  );
  res.send("success");

  if (
    [fullName, username, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.fields?.avatar[0]?.path;
  const coverImageLocalPath = req.fields?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = uploadOnCloudinary(avatarLocalPath);
  const coverImage = uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(200, createdUser, "User has been registered successfully");
});

export { registerUser };
