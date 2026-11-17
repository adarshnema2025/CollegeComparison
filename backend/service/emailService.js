// import { Resend } from 'resend';
const {Resend}=require('resend')
const resend = new Resend(process.env.RESEND_API_KEY);


const emailSender=async(name,email)=>{
    const result=await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'adarshnema2025@gmail.com',
  subject: `Hello ${name}`,
  html: `<p>Your <strong>email is ${email}</strong>!</p>`
});
return result;

}

module.exports={
    emailSender
}

