const pool= require("../config/db");
const bcrypt=require("bcrypt");

//Checking if user exist using email
const findByEmail=async(email)=>{
    const result=await pool.query(
        `SELECT * FROM users WHERE email=$1`,[email]
    );
    return result.rows[0];
}

//Create user

const createUser=async(name,email,password,mobile,state,city,education_level,target_degree,preferred_city)=>{
    const hashedPassword=await bcrypt.hash(password,10);


    const result=await pool.query(
        `INSERT INTO users(name,email,password_hash,mobile,state,city,education_level,target_degree,preferred_city)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id,name,email,created_at
        
        `,[name,email,hashedPassword,mobile,state,city,education_level,target_degree,preferred_city]
    );

    return result.rows[0];
}


//Current user
// const currentUser=async()=>{
//     const result=await pool.query(
         
//     )
// }


module.exports={
    createUser,
    findByEmail
}