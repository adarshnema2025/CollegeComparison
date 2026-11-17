const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const authService = require("../service/authService");

const emailService=require("../service/emailService");



//Register

const register = async (req, res, next) => {
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
        error: "Name, email and password are required",
      });
    }

    const checkUser = await authService.findByEmail(email);
    if (checkUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    const user = await authService.createUser(
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
    if (user) {                                                                                                                                                       
      // Fire-and-forget with error logging                                                                                                                           
      emailService.emailSender(user.name, user.email).catch((err) => {                                                                                                
        console.error("Welcome email failed to send:", err);                                                                                                          
      });                                                                                                                                                             
    }        
    return res.status(201).json({ success: true, data: user });

  } catch (error) {
    next(error);
  }
};

//Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await authService.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
  
};
