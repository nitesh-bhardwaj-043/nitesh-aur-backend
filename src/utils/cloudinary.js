import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //console when file is uploaded successfully
    // console.log("File is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    //delete the temporary saved file from server as upload has failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteImageFromCloudinary = async (publicUrl) => {
  try {
    const publicId = publicUrl.split(".")[2].split("/").slice(5).join("/");
    cloudinary.api
      .delete_resources(publicId)
      .then((result) => {
        console.log("Deleted!!");
        return result;
      })
      .catch((error) => {
        console.log(`🔴☁️ Error while deleting files ${error}`);
        return null;
      });
  } catch (error) {
    console.log(`🔴☁️ Error while deleting files ${error}`);
    return null;
  }
};

export { uploadOnCloudinary, deleteImageFromCloudinary };
