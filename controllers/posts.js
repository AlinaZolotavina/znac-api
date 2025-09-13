/* eslint-disable no-console */
const fs = require('fs');
const Post = require('../models/post');
const NotFoundError = require('../errors/not-found-err');
// const { PHOTO_NOT_FOUND_ERROR_MSG, SUCCESSFUL_PHOTO_DELETE_MSG } = require('../utils/constants');

const getPosts = (req, res, next) => {
  Post.find({})
    .then((posts) => res.status(200).send(posts))
    .catch(next);
};

const findPost = (req, res, next) => {
  const { keyWord, selectedTheme } = req.body;
  Post.find({$or:[{ theme: { $regex: keyWord } }, {title: { $regex: keyWord }}, {text: { $regex: keyWord }}, {theme: selectedTheme }]})
    .then((posts) => {
      res.send(posts);
    })
    .catch(next);
};

const deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return next(new NotFoundError('Post not found'));
      }
      // if (photo.owner._id.toString() !== req.user._id.toString()) {
      //   return next(new ForbiddenError(FORBIDDEN_ERROR_MSG));
      // }

      // !!! THIS PART DOESN'T WORKING, GOT 500 ERROR !!!

      // const postName = post.photoLink.slice((post.link.lastIndexOf('/') + 1));
      // const path = `./public/${postName}`;
      // fs.access(path, fs.constants.F_OK, (error) => {
      //   if (error) {
      //     console.error(`Post photo ${path} doesn't exist.`);
      //   } else {
      //     fs.unlink(path, (err) => {
      //       if (err) {
      //         console.error(`Failed to delete post photo: ${err}`);
      //         return false;
      //       }
      //       console.log(`Post photo ${path} has been successfully deleted.`);
      //       return true;
      //     });
      //   }
      // });
      return post.remove();
    })
    .then(() => {
      res.status(200).send({ message: 'Post has been successfully deleted.' });
    })
    .catch(next);
};

const addPost = (req, res) => {
  const owner = req.user._id;
  Post.create({ owner, ...req.body })
    .then((post) => res.status(201).send(post))
    .catch((err) => console.log(err));
};

const updatePost = (req, res, next) => {
  const { postId } = req.params;
  const { newTheme, newIcon, newTitle, newPhotoLink, newHashtags, newText } = req.body;
  if (newPhotoLink === '') {
    Post.findByIdAndUpdate(postId, { $set: { theme: newTheme, icon: newIcon, title: newTitle, hashtags: newHashtags, text: newText }, $unset: { photoLink : ''} }, { new: true, runValidators: true })
    .then((post) => {
      if (!post) {
        return next(new NotFoundError('Post not found'));
      }
      return res.status(200).send(post);
    })
    .catch(next);
  } else {
    Post.findByIdAndUpdate(postId, { theme: newTheme, icon: newIcon, title: newTitle, photoLink: newPhotoLink, hashtags: newHashtags, text: newText }, { new: true, runValidators: true })
    .then((post) => {
      if (!post) {
        return next(new NotFoundError('Post not found'));
      }
      return res.status(200).send(post);
    })
    .catch(next);
  }
  
};

const uploadPostPhoto = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new NotFoundError('No post photo to upload'));
  }
  const { file } = req.files;
  // const filePath = new URL(`./${file.name}`, 'https://api.znac.org/');
  const filePath = new URL(`./${file.name}`, 'http://localhost:4000/');
  return file.mv(`./public/${file.name}`)
    .then(() => {
      res.status(200).send({
        status: true,
        message: 'Post photo is uploaded',
        data: {
          name: file.name,
          size: file.size,
          path: filePath,
        },
      });
    })
    .catch(next);
};

// const editHashtags = (req, res, next) => {
//   const { photoId } = req.params;
//   const { newHashtags } = req.body;
//   Photo.findByIdAndUpdate(photoId, { hashtags: newHashtags }, { new: true, runValidators: true })
//     .then((photo) => {
//       if (!photo) {
//         return next(new NotFoundError(PHOTO_NOT_FOUND_ERROR_MSG));
//       }
//       return res.send(photo);
//     })
//     .catch(next);
// };

module.exports = {
  getPosts,
  findPost,
  deletePost,
  addPost,
  updatePost,
  uploadPostPhoto,
//   editHashtags,
};
