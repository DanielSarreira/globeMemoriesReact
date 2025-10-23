/**
 * PropTypes validation for critical components
 * @module propTypesValidation
 */

import PropTypes from 'prop-types';

/**
 * Travel object PropTypes
 */
export const TravelPropTypes = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).required,
  name: PropTypes.string.required,
  country: PropTypes.string.required,
  city: PropTypes.string,
  description: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  highlightImage: PropTypes.string,
  images: PropTypes.arrayOf(PropTypes.string),
  views: PropTypes.number,
  likes: PropTypes.number,
  comments: PropTypes.number,
  category: PropTypes.arrayOf(PropTypes.string),
  rating: PropTypes.number,
  user: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      username: PropTypes.string,
      name: PropTypes.string,
      profilePicture: PropTypes.string
    })
  ])
});

/**
 * User object PropTypes
 */
export const UserPropTypes = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).required,
  username: PropTypes.string.required,
  name: PropTypes.string.required,
  email: PropTypes.string,
  profilePicture: PropTypes.string,
  bio: PropTypes.string,
  followers: PropTypes.number,
  following: PropTypes.number
});

/**
 * Comment object PropTypes
 */
export const CommentPropTypes = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).required,
  text: PropTypes.string.required,
  user: UserPropTypes,
  likes: PropTypes.number,
  replies: PropTypes.arrayOf(PropTypes.object),
  createdAt: PropTypes.string
});

/**
 * Toast notification PropTypes
 */
export const ToastPropTypes = PropTypes.shape({
  message: PropTypes.string.required,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']).required,
  duration: PropTypes.number
});

/**
 * Modal PropTypes
 */
export const ModalPropTypes = {
  isOpen: PropTypes.bool.required,
  onClose: PropTypes.func.required,
  title: PropTypes.string,
  children: PropTypes.node
};

/**
 * File upload PropTypes
 */
export const FileUploadPropTypes = {
  onUpload: PropTypes.func,
  onError: PropTypes.func,
  maxSize: PropTypes.number,
  acceptedFormats: PropTypes.arrayOf(PropTypes.string)
};

export default {
  TravelPropTypes,
  UserPropTypes,
  CommentPropTypes,
  ToastPropTypes,
  ModalPropTypes,
  FileUploadPropTypes
};
