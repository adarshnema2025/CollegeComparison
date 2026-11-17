const pool = require("../config/db");
const bcrypt = require("bcrypt");

// CREATE USER
const createUser = async (
  name,
  email,
  password,
  mobile,
  state,
  city,
  education_level,
  target_degree,
  preferred_city
) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users(name, email, password_hash, mobile, state, city, education_level, target_degree, preferred_city)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, email, mobile, state, city, education_level, target_degree, preferred_city, role, created_at`,
    [
      name,
      email,
      hashedPassword,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city,
    ]
  );

  return result.rows[0];
};

// GET ALL USERS
const getAllUser = async () => {
  const result = await pool.query(
    `SELECT id, name, email, mobile, state, city, education_level, target_degree, preferred_city, role, created_at 
     FROM users 
     ORDER BY id ASC`
  );
  return result.rows;
};

// GET INDIVIDUAL USER
const getSingleUser = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, mobile, state, city, education_level, target_degree, preferred_city, role, created_at 
     FROM users 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

// UPDATE DETAILS OF THE USER
const updateUser = async (
  name,
  email,
  id,
  mobile,
  state,
  city,
  education_level,
  target_degree,
  preferred_city
) => {
  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         email = COALESCE($2, email),
         mobile = COALESCE($3, mobile),
         state = COALESCE($4, state),
         city = COALESCE($5, city),
         education_level = COALESCE($6, education_level),
         target_degree = COALESCE($7, target_degree),
         preferred_city = COALESCE($8, preferred_city)
     WHERE id = $9 
     RETURNING id, name, email, mobile, state, city, education_level, target_degree, preferred_city, role, created_at`,
    [
      name,
      email,
      mobile,
      state,
      city,
      education_level,
      target_degree,
      preferred_city,
      id,
    ]
  );
  return result.rows[0];
};

// DELETE user entry
const deleteUser = async (id) => {
  const result = await pool.query(
    `DELETE FROM users
     WHERE id = $1
     RETURNING id, name, email`,
    [id]
  );
  return result.rows[0];
};

const meProfile=async(id)=>{
  const result=await pool.query(
    `SELECT id, name, email, mobile, state, city, education_level, target_degree, preferred_city, role, created_at 
      FROM users WHERE id=$1 
    `,[id]
  )
  return result.rows[0];
}


module.exports = {
  getAllUser,
  getSingleUser,
  updateUser,
  deleteUser,
  createUser,
  meProfile
};
