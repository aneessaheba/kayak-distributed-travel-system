const User = require('../models/userModel');

/**
 * User Controller - Handles HTTP requests and responses
 * Works with Mongoose User model
 */

const UserController = {

  /**
   * Create new user
   * POST /api/users
   */
  async createUser(req, res, next) {
    try {
      const { user_id, first_name, last_name, email, password, phone_number, address, city, state, zip_code, profile_image } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ userId: user_id }, { email: email?.toLowerCase() }] });
      
      if (existingUser) {
        if (existingUser.userId === user_id) {
          return res.status(409).json({
            success: false,
            error: 'duplicate_user',
            message: 'User with this ID already exists'
          });
        }
        return res.status(409).json({
          success: false,
          error: 'duplicate_email',
          message: 'Email already registered'
        });
      }

      // Create new user
      const user = new User({
        userId: user_id,
        firstName: first_name,
        lastName: last_name,
        email: email,
        password: password,
        phoneNumber: phone_number || '',
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zip_code || '',
        profileImage: profile_image || ''
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: formatUserResponse(user)
      });

    } catch (error) {
      console.error('Create user error:', error);
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'duplicate_user',
          message: 'User with this ID or email already exists'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to create user'
      });
    }
  },

  /**
   * Get user by ID
   * GET /api/users/:user_id
   */
  async getUserById(req, res, next) {
    try {
      const { user_id } = req.params;

      const user = await User.findOne({ userId: user_id });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: formatUserResponse(user)
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to get user'
      });
    }
  },

  /**
   * Get user by email
   * GET /api/users/email/:email
   */
  async getUserByEmail(req, res, next) {
    try {
      const { email } = req.params;

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: formatUserResponse(user)
      });

    } catch (error) {
      console.error('Get user by email error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to get user'
      });
    }
  },

  /**
   * Update user
   * PUT /api/users/:user_id
   */
  async updateUser(req, res, next) {
    try {
      const { user_id } = req.params;
      const { first_name, last_name, email, password, phone_number, address, city, state, zip_code, profile_image } = req.body;

      const user = await User.findOne({ userId: user_id });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      // Check for duplicate email if email is being changed
      if (email && email.toLowerCase() !== user.email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            error: 'duplicate_email',
            message: 'Email already in use'
          });
        }
      }

      // Update fields
      if (first_name) user.firstName = first_name;
      if (last_name) user.lastName = last_name;
      if (email) user.email = email;
      if (password) user.password = password;
      if (phone_number !== undefined) user.phoneNumber = phone_number;
      if (address !== undefined) user.address = address;
      if (city !== undefined) user.city = city;
      if (state !== undefined) user.state = state;
      if (zip_code !== undefined) user.zipCode = zip_code;
      if (profile_image !== undefined) user.profileImage = profile_image;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: formatUserResponse(user)
      });

    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to update user'
      });
    }
  },

  /**
   * Delete user
   * DELETE /api/users/:user_id
   */
  async deleteUser(req, res, next) {
    try {
      const { user_id } = req.params;

      const result = await User.findOneAndDelete({ userId: user_id });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to delete user'
      });
    }
  },

  /**
   * Login user (verify credentials)
   * POST /api/users/login
   */
  async loginUser(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Email and password are required'
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'invalid_credentials',
          message: 'Invalid email or password'
        });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'invalid_credentials',
          message: 'Invalid email or password'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: formatUserResponse(user)
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Login failed'
      });
    }
  },

  /**
   * Get all users (for admin/testing)
   * GET /api/users?limit=100&offset=0
   */
  async getAllUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const users = await User.find()
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      const totalCount = await User.countDocuments();

      res.status(200).json({
        success: true,
        data: users.map(formatUserResponse),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to get users'
      });
    }
  },

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  async getUserStats(req, res, next) {
    try {
      const totalUsers = await User.countDocuments();

      res.status(200).json({
        success: true,
        data: {
          totalUsers
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to get stats'
      });
    }
  },

  /**
   * Upload profile image
   * POST /api/users/:user_id/upload-image
   */
  async uploadProfileImage(req, res, next) {
    try {
      const { user_id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'No image file provided'
        });
      }

      const user = await User.findOne({ userId: user_id });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      const imageUrl = `/uploads/users/${req.file.filename}`;
      user.profileImage = imageUrl;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          image_url: imageUrl,
          user: formatUserResponse(user)
        }
      });

    } catch (error) {
      console.error('Upload profile image error:', error);
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: error.message || 'Failed to upload image'
      });
    }
  }
};

// Helper function to format user response (snake_case for API)
function formatUserResponse(user) {
  return {
    user_id: user.userId,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone_number: user.phoneNumber,
    address: user.address,
    city: user.city,
    state: user.state,
    zip_code: user.zipCode,
    profile_image: user.profileImage,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
}

module.exports = UserController;
