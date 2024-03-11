// earlier code
import cloudinary from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploads = (file, folder) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(
      file,
      (result) => {
        // console.log(result);
        resolve({
          url: result.url,
          publicId: result.public_id,
          assetId: result.asset_id,
          signature: result.signature,
        });
      },
      {
        resource_type: 'auto',
        folder: folder,
      }
    );
  });
};

const uploader = async (path) => {
  return await cloudinaryUploads(path, 'realTimeChatApp');
};

const singleFileUpload = async (file, res) => {
  const { path } = file;
  try {
    const newPath = await uploader(path);

    fs.unlinkSync(path);
    return newPath;
  } catch (error) {
    console.log(error);

    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
    });
  }
};

const multipleFileUploads = async (files, res) => {
  const urls = [];

  for (const file of files) {
    const { path } = file;
    try {
      const newPath = await uploader(path);

      // push the multiple file paths to cloudinary
      urls.push(newPath);
      // console.log('urls:', urls);

      // delete the file from server after successful upload
      fs.unlinkSync(path);
    } catch (error) {
      return res.json({
        message: 'Something happened',
        status: 500,
        success: false,
      });
    }
  }
  return urls;
};

const handleFileUpload = async (req, res) => {
  try {
    // console.log('multiple uploads:', req.file);
    let newPath;
    // console.log('cloud:', req);
    if (req.file) {
      newPath = await singleFileUpload(req.file, res);
    }
    if (req.files && req.files.length > 1) {
      console.log('multiple uploads:', req.file);
      newPath = await multipleFileUploads(req.files, res);
    } else if (req.files && req.files.length === 1) {
      newPath = await singleFileUpload(req.files[0], res);
      console.log('single upload:', req.file);
    }
    console.log('res:', newPath);
    return newPath;
  } catch (error) {
    console.log(error);
    return res.json({
      message: 'Something happened',
      success: false,
      status: 500,
    });
  }
};

// const cloudinaryDestroy = async (public_id) => {
//   try {
//     console.log('Received publicIds:', public_id);
//     if (!Array.isArray(public_id)) {
//       console.log('not an array');
//       throw new Error('Public id must be an array');
//     }

//     const deletePromise = public_id.map(async (publicId) => {
//       try {
//         console.log(typeof publicId);

//         const result = await cloudinary.uploader.destroy(publicId);
//         console.log(result);
//         console.log('image deleted successfully');
//         return result;
//       } catch (error) {
//         console.log(error);
//         return error;
//       }
//     });
//     const deletedResults = await Promise.all(deletePromise);
//     console.log('Deletion results:', deletedResults);

//     // for (const publicId of public_id) {
//     //   const result = await cloudinary.uploader.destroy(publicId);
//     //   console.log(result);
//     // }

//     // await Promise.all(deleteAll);
//   } catch (error) {
//     console.log(error);
//     // return res.json({
//     //   message: 'Something happened',
//     //   status: 500,
//     //   success: false,
//     // });
//   }
// };

const cloudinaryDestroy = async (public_id) => {
  try {
    console.log('Received public_ids:', public_id);
    const publicIdsArray = Array.isArray(public_id) ? public_id : [public_id];
    const deletePromise = publicIdsArray.map(async (publicId) => {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(result);
        console.log('Image deleted successfully');
        return result;
      } catch (error) {
        console.log(error);
        return error;
      }
    });

    const deletedResults = await Promise.all(deletePromise);
    console.log('Deletion results: ', deletedResults);
  } catch (error) {
    console.log(error);
  }
};
export { cloudinaryUploads, cloudinaryDestroy, handleFileUpload };
