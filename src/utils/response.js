const successResponse = ({ message = "Thành công", data = null }) => {
  return { success: true, message, data };
};

const errorResponse = ({ message = "Có lỗi sảy ra", errors = [] }) => {
  return { success: false, message, errors };
};

export { successResponse, errorResponse };
