const { User } = require("../models/user.model");
const { HashPassword } = require("../util/authHelpers");
const logger = require("../util/logger");

const ADMIN_CREDENTIALS = {
    email: 'master_admin', // As requested by user, stored in email field
    password: 'admin_oanh_hao',
    name: 'Master Admin'
};

/**
 * Seed master admin user if not exists
 */
async function seedAdmin() {
    try {
        const existingAdmin = await User.findOne({
            where: { user_email: ADMIN_CREDENTIALS.email }
        });

        if (existingAdmin) {
            logger.info("Admin user already exists.");

            // Check if role is updated
            if (existingAdmin.role !== 'ADMIN') {
                existingAdmin.role = 'ADMIN';
                await existingAdmin.save();
                logger.info("Updated existing admin role to ADMIN.");
            }
            return;
        }

        const hashedPassword = await HashPassword(ADMIN_CREDENTIALS.password);

        await User.create({
            user_full_name: ADMIN_CREDENTIALS.name,
            user_email: ADMIN_CREDENTIALS.email,
            user_hash_password: hashedPassword,
            role: 'ADMIN',
            user_is_active: true
        });

        logger.info(`Master Admin created successfully: ${ADMIN_CREDENTIALS.email}`);
    } catch (error) {
        logger.error("Error seeding admin user:", error);
    }
}

module.exports = seedAdmin;
