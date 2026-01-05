// User Service - Business Logic Layer
const userRepository = require("../repositories/user.repository");
const cloudinary = require("../config/cloudinary.config");

/**
 * Lấy thông tin người dùng theo ID
 */
async function getUserById(userId) {
    return await userRepository.findById(userId);
}

/**
 * Cập nhật thông tin người dùng
 */
async function updateUser(userId, userData) {
    const user = await userRepository.findById(userId);
    if (!user) {
        return { success: false, message: "Người dùng không tồn tại." };
    }

    await userRepository.update(userId, userData);
    return { success: true };
}

/**
 * Cập nhật avatar người dùng
 */
async function updateAvatar(userId, file) {
    const user = await userRepository.findByIdFull(userId);
    if (!user) {
        return { success: false, statusCode: 404, message: "Người dùng không tồn tại." };
    }

    // Xóa ảnh cũ nếu có
    if (user.user_profile_picture) {
        try {
            await cloudinary.uploader.destroy(user.user_profile_picture);
        } catch (error) {
            // Ignore error if old image doesn't exist
        }
    }

    // Upload ảnh mới
    return new Promise((resolve) => {
        cloudinary.uploader
            .upload_stream(
                { folder: "userMusicAvatar" },
                async (error, result) => {
                    if (error) {
                        resolve({
                            success: false,
                            statusCode: 500,
                            message: "Cloudinary upload failed: " + error.message,
                        });
                        return;
                    }

                    user.user_profile_picture = result.secure_url;
                    await user.save();

                    resolve({
                        success: true,
                        user: user,
                    });
                }
            )
            .end(file.buffer);
    });
}

module.exports = {
    getUserById,
    updateUser,
    updateAvatar,
};
