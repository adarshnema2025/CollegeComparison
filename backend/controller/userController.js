const userService = require("../service/userService");

// GET ALL USERS
const getAllUser = async (req, res, next) => {
  try {
    const users = await userService.getAllUser();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// GET A SPECIFIC USER
const getSpecificUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getSingleUser(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found with this id" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// EDIT USER
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city,
    } = req.body;

    const user = await userService.updateUser(
      name,
      email,
      id,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// DELETE USER
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// CREATE USER
const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required fields",
      });
    }

    const user = await userService.createUser(
      name,
      email,
      password,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city
    );

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


const findByEmail=async(req,res,next)=>{
  
  try {
    const {email}=req.body;
    const user=await userService.findByEmail(email);
    if(!user){
      return res.status(400).json({success:false,data:"User with this email is not available"})
    }
    res.status(200).json({success:true,data:user})
  } catch (error) {
  next(error);
  }
}

const meProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.id;
    const profile = await userService.meProfile(userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city,
    } = req.body;

    const user = await userService.updateUser(
      name,
      email,
      userId,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUser,
  getSpecificUser,
  updateUser,
  deleteUser,
  createUser,
  findByEmail,
  meProfile,
  updateMyProfile,
};
