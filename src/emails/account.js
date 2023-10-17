const sgMail = require("@sendgrid/mail");

const sendAPI =process.env.SENDGRID_API_KEY

const fromEmail=""


sgMail.setApiKey(sendAPI);

const createAccount = (email, name) => {
  const msg = {
    to: email,
    from: fromEmail,
    subject: "Welcome to my to-do list app",
    text: `Dear ${name}, \t
    Sending this email to remind you that you created an account on my to-do list app and am really gratefull`
  };
sgMail.send(msg)
}

const deleteAccount=(email,name)=>{
  const msg={
    to:email,
    from:fromEmail,
    subject:"Sad to see you go away",
    text:`Dear ${name}, \t
    Please reply to this email and tell us if there is anything you want us to improve in the future`
  }
sgMail.send(msg)
}

module.exports={createAccount,deleteAccount}
