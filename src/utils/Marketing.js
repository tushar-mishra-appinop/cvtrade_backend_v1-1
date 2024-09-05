const axios = require("axios");
const nodemailer = require("nodemailer");
const {
    SIB_SMTP_HOST,
    SIB_SMTP_PORT,
    SIB_SMTP_USERNAME,
    SIB_SMTP_PASSWORD,
    SIB_FROM,
} = process.env;

(AUTH_KEY = "1d16ae41c536e17c"), (PROJECT_NAME = "CV Trade");
const mobile_marketing = async (type, message, receiver) => {
    try {
        if (type == "verification") {
            console.log("in verification");
            let formattedNumber = receiver.replace(/^(0|91|\+91)?(\d{10})$/, '$2');
            console.log(formattedNumber, "testing versiob");
            let sendOtp = await axios.get(
                `https://api.authkey.io/request?authkey=${AUTH_KEY}&mobile=${formattedNumber}&country_code=+91&sid=10724&company="account at ${PROJECT_NAME}"&otp=${message}&time=1 minutes`
            );
            console.log("OTP Send Successfully", sendOtp.data);
        } else if (type == "exchange") {
            // We can add twilio msg service here
        }
    } catch (error) {
        console.log("we are facing some error while sending otp");
    }
};

const email_marketing = async (type, message, receiver) => {
    // Check the console output to see the structure of the 'message' object.
    try {
        // console.log(SIB_SMTP_HOST, SIB_SMTP_PORT, SIB_SMTP_USERNAME, SIB_SMTP_PASSWORD, SIB_FROM, "email logs");
        const transporter = nodemailer.createTransport({
            host: "smtp.zoho.in",
            port: 587,
            secure: false,
            auth: {
                user: "cvtrade@zohomail.in",
                pass: "Suzu@43690",
            },
            tls: {
                rejectUnauthorized: false,
            },
            requireTLS: true,
        });

        let mailOptions = {};

        if (type === "verification") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Verification Email",
                text: `Your OTP is: ${message}`,
                html: `
              <!doctype html>
              <html lang="en-US">
              
              <head>
              <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
              <title>CV Trade</title>
              <meta name="description" content="Reset Password Email Template.">
              <link rel="icon" type="image/png" sizes="32x32" href="https://backend.cvtrade.io/email_banner_latest.png">
              <style type="text/css">
                  a:hover {text-decoration: underline !important;}
              </style>
          </head>
          
              
              <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #00181c;" leftmargin="0">
                  <!--100% body table-->
                  <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#00181c"
                      style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                      <tr>
                          <td>
                              <table style="background-color: #00181c; max-width:670px;  margin:0 auto;" width="100%" border="0"
                                  align="center" cellpadding="0" cellspacing="0">
                                  <tr>
                                      <td style="height:80px;">&nbsp;</td>
                                  </tr> 
                                   
                                  <tr>
                                      <td>
                                          <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background: #0c181e;border-radius: 28px;text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow: 0 0 0 1px rgb(165 231 156 / 29%);">
              
                                              <tr>
                                                <td style="text-align:center; padding: 15px;">
                                                  <a href="https://cvtrade.io/" title="logo" target="_blank">
                                                    <img width="670" src="https://backend.cvtrade.io/email_banner_latest.png" title="logo" alt="logo" style=" margin-bottom: -7px;">
                                                  </a>
                                                </td>
                                              </tr>
                                              <tr>
              
              
                                              <tr>
                                                  <td style="height:40px;">&nbsp;</td>
                                              </tr>
                                              <tr>
                                                  <td style="padding:0 35px;">
                                                      <h1 style="color:#ffffff; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                                          
                                                         Welcome to CV Trade
              
                                                      </h1>
                                                      <span
                                                          style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
              
                                                      <p style="color:#ffffffab; text-align:left; font-size:15px;line-height:24px; margin:0;">
              
                                                         Please use the code below to verify.
              
                                                          <br/><br/>
              
                                                          <span style="font-size:22px; color:#fff; font-weight:500">
                                                              Verification code: ${message}
                                                          </span>
              
                                                          <br/><br/>  
               
                                                          <br/> 
                                                          <span style="color:#fff; " >CV Trade Team</span>
              
                                                           
              
                                                          <br/> 
              
                                                          <br/>
              
                                                          <small>This is an automated message, Please do not reply.</small>
              
                                                          
              
                                                      </p>
                                                       
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="height:40px;">&nbsp;</td>
                                              </tr>
                                          </table>
                                      </td>
                                  <tr>
                                       
                                  </tr>
                                  <tr>
                                      <td style="text-align:center;">
                                         <ul class="footer-list-widget" style="
                                              list-style: none;
                                              text-decoration: none;
                                              display: flex;
                                              align-items: center;
                                              justify-content: center;
                                          ">
                                              <li><a target="_blank" href="https://www.facebook.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg" 
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Facebook</a></li>
                                              <li><a target="_blank" href="https://www.instagram.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Instagram</a></li>
                                              <li><a target="_blank" href="https://www.reddit.com/user/Cvtrade/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Reddit</a></li>
                                              <li><a target="_blank" href="https://youtube.com/@CVTrade?si=3bkQRCdzvvG4P5PV"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Youtube</a></li>
                                              <li><a target="_blank" href="https://t.me/+VD32TwJiXQMyY2E1"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Telegram</a></li>
                                              <li><a target="_blank" href="https://www.quora.com/profile/CV-Trade"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Quora</a></li>
                                              <li><a target="_blank" href="https://medium.com/@cvtradeexchange"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Medium</a></li>
                                          </ul>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="height:80px;">&nbsp;</td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                  </table>
                  <!--/100% body table-->
              </body>
              
              </html>`,
            };
        } else if (type === "login") {
            const loginDateTime = new Date();

            // IST offset is +5:30 from UTC
            const ISTOffset = 5.5 * 60 * 60 * 1000; // in milliseconds

            const istDateTime = new Date(loginDateTime.getTime() + ISTOffset);
            const dateTime = istDateTime.toISOString().replace('T', ' ').substring(0, 19);
            console.log('IST DateTime:', dateTime);


            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Login Email",
                html: `<p>
              <br><br>
              A login to your Cv_trade account was recorded on ${dateTime} from a new IP: ${message.ip || "Unknown"
                    }.<br>
              IP Address: ${message["ip"] || "Unknown"}<br><br>
          
            Account: ${receiver}<br>
            IP Address: ${message["ip"] || "Unknown"}<br><br>
           Note: If you did not initiate this request, please change your password immediately.<br><br>
            Best regards,<br>
            CV_TRADE

            </p>`,
            };
        } else if (type === "registration") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Registration Email",
                text: `Registration details`,
                html: `<!doctype html>
              <html lang="en-US">
              
              <head>
                  <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
                  <title>CV Trade</title>
                  <meta name="description" content="Reset Password Email Template.">
                  <link rel="icon" type="image/png" sizes="32x32" href="images/favicon/favicon.png">
                  <style type="text/css">
                      a:hover {text-decoration: underline !important;}
                  </style>
              
              </head>
              
              <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #00181c;" leftmargin="0">
                  <!--100% body table-->
                  <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#00181c"
                      style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                      <tr>
                          <td>
                              <table style="background-color: #00181c; max-width:670px;  margin:0 auto;" width="100%" border="0"
                                  align="center" cellpadding="0" cellspacing="0">
                                  <tr>
                                      <td style="height:80px;">&nbsp;</td>
                                  </tr> 
                                   
                                  <tr>
                                      <td>
                                          <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background: #0c181e;border-radius: 28px;text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow: 0 0 0 1px rgb(165 231 156 / 29%);">
              
                                              <tr>
                                                <td style="text-align:center; padding: 15px;">
                                                  <a href="https://cvtrade.io/" title="logo" target="_blank">
                                                    <img width="670" src="https://backend.cvtrade.io/email_banner_latest.png" title="logo" alt="logo" style=" margin-bottom: -7px;">
                                                  </a>
                                                </td>
                                              </tr>
                                              <tr>
              
                                              <tr>
                                                  <td style="height:40px;">&nbsp;</td>
                                              </tr>
                                              <tr>
                                                  <td style="padding:0 35px;">
                                                      <h1 style="color:#ffffff; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                                          
                                                        Congratulation
              
                                                      </h1>
                                                      <span
                                                          style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
              
                                                      <p style="color:#ffffffab; text-align:center; font-size:15px;line-height:24px; margin:0;">
                                                           
              
                                                         
              
                                                          <span style="font-size:16px; color:#fff" >
                                                          You have successfully registered with cvtrade.
              
                                                              <br/>
                                                              <br/>
                                                              Now you can deposit and trade.
                                                          </span>                                            
                                                           
                                                          
              
                                                          
              
                                                      </p>
              
              
                                                          <br/>
                                                          <br/>
              
              
                                                      <a href="javascript:void(0);"
                                                          style="background:#7ED375;text-decoration:none !important; font-weight:500; color:#000000;text-transform:uppercase; font-size:16px;padding:10px 80px ;display:inline-block;border-radius:50px;"> Start Trading 
                                                           </a> 
                                                      <p style="color:#ffffffab; text-align:center; font-size:15px;line-height:24px; margin:0;">
              
                                                      <br/>  
              
                                                          <small>Thanks you for choosing CV Trade.</small>
                                                      </p>
              
                                                       
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="height:40px;">&nbsp;</td>
                                              </tr>
                                          </table>
                                      </td>
                                  <tr>
                                       
                                  </tr>
                                  <tr>
                                      <td style="text-align:center;">
                                         <ul class="footer-list-widget" style="
                                              list-style: none;
                                              text-decoration: none;
                                              display: flex;
                                              align-items: center;
                                              justify-content: center;
                                          ">
                                              <li><a target="_blank" href="https://www.facebook.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg" 
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Facebook</a></li>
                                              <li><a target="_blank" href="https://www.instagram.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Instagram</a></li>
                                              <li><a target="_blank" href="https://www.reddit.com/user/Cvtrade/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Reddit</a></li>
                                              <li><a target="_blank" href="https://youtube.com/@CVTrade?si=3bkQRCdzvvG4P5PV"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Youtube</a></li>
                                              <li><a target="_blank" href="https://t.me/+VD32TwJiXQMyY2E1"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Telegram</a></li>
                                              <li><a target="_blank" href="https://www.quora.com/profile/CV-Trade"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Quora</a></li>
                                              <li><a target="_blank" href="https://medium.com/@cvtradeexchange"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Medium</a></li>
                                          </ul>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="height:80px;">&nbsp;</td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                  </table>
              </body>
              
              </html>`,
            };
        } else if (type === "forgot") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Password Reset Email",
                text: `Password reset instructions: ${message}`,
                html: `<p>
                  Password Reset,<br><br>
                  You have requested a password reset for your CV-TRADE account.<br>
                  Follow the instructions in the email to reset your password.<br><br>
                  ${message}<br><br>
              </p>`,
            };
        } else if (type === "withdrawal_confirmation") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Withdrawal Confirmation Email",
                text: `Withdrawal confirmation details: ${message.amount} ${message.short_name}`,
                html: `<p>
                  Withdrawal Confirmation,<br><br>
                  You have initiated a withdrawal of ${message.amount} ${message.short_name} from your CV_TRADE account.<br>
                  Address: ${message.to_address}<br>
                  If this action was not initiated by you, please contact support immediately.<br><br>
              </p>`,
            };
        }
        else if (type === "withdrawal_admin_confirmation") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Withdrawal Confirmation Email",
                text: `Congratulations! Your withdrawal of ${message.amount} ${message.short_name} has been successfully completed.`,
                html: `<p>
                        Withdrawal Confirmation,<br><br>
                        Congratulations! Your withdrawal of ${message.amount} ${message.short_name} from your CV_TRADE account has been successfully completed.<br>
                        Address: ${message.to_address}<br>
                         please contact support immediately,if Find Any Issues.<br><br>
                    </p>`,
            };
        }
        else if (type === "blockchain_low_balance") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "BNB lOW balance,please add bnb ",

            };
        }
        else if (type === "transfer_done") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: " Transfer Amount is done ,from backend ",

            };
        }
        else if (type === "New_Password") {
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Password Changed Email",
                text: `Your password has been changed.`,
                html: `<p>
                  Password Changed,<br><br>
                  Your password for CV_TRADE account has been successfully changed.<br><br>
                  If you did not perform this action, please contact support immediately.<br><br>
              </p>`,
            };
        }
        else if (type === "buyerFundTransferred") {
            const order_id = message?.order_id
            const Amount = message?.fixed_price * message?.amount
            const Currency = message?.quote_short_name
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Payment Initiated - Buyer Has Transferred the Funds",
                html: `<!doctype html>
<html lang="en-US">
   <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <title>CV Trade</title>
      <meta name="description" content="Payment Initiated - Buyer Has Transferred the Funds">
      <link rel="icon" type="image/png" sizes="32x32" href="https://backend.cvtrade.io/email_banner_latest.png">
      <style type="text/css">
         a:hover {text-decoration: underline !important;}
      </style>
   </head>
   <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #00181c;" leftmargin="0">
      <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#00181c"
         style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
         <tr>
            <td>
               <table style="background-color: #00181c; max-width:670px; margin:0 auto;" width="100%" border="0"
                  align="center" cellpadding="0" cellspacing="0">
                  <tr>
                     <td style="height:80px;">&nbsp;</td>
                  </tr>
                  <tr>
                     <td>
                        <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0"
                           style="max-width:670px;background: #0c181e;border-radius: 28px;text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow: 0 0 0 1px rgb(165 231 156 / 29%);">
                           <tr>
                              <td style="text-align:center; padding: 15px;">
                                 <a href="https://cvtrade.io/" title="logo" target="_blank">
                                 <img width="670" src="https://backend.cvtrade.io/email_banner_latest.png" title="logo" alt="logo" style=" margin-bottom: -7px;">
                                 </a>
                              </td>
                           </tr>
                           <tr>
                              <td style="height:40px;">&nbsp;</td>
                           </tr>
                           <tr>
                              <td style="padding:0 35px;">
                                 <h1
                                    style="color:#ffffff; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                    Payment Initiated - Buyer Has Transferred the Funds
                                 </h1>
                                 <p
                                    style="color:#ffffff; text-align:left; font-size:15px;line-height:24px; margin:0;">
                                    <br><br>
                                    We are pleased to inform you that the buyer has successfully initiated the
                                    payment for your P2P order on our platform. Please take the following steps
                                    to proceed:
                                    <br><br>
                                    <strong>Order Details:</strong><br>
                                    Order ID: ${order_id}<br>
                                    <strong>Next Steps:</strong><br>
                                    1. Verify the Payment:<br>
                                    - Please check your payment method to verify the receipt of
                                    the funds. Ensure the amount matches the order details.<br><br>
                                    2. Confirm Payment Receipt:<br>
                                    - Once you have confirmed the payment, please proceed to mark the payment as
                                    received on our platform.<br><br>
                                    If you encounter any issues during the process or have any questions, please
                                    don't hesitate to contact our support team.
                                    <br><br>
                                    Thank you for using our platform for your P2P transactions. We appreciate
                                    your business and look forward to serving you again.
                                    <br><br>
                                    Best regards,<br>
                                  CV Trade-EXCHANGE
                                 </p>
                              </td>
                           </tr>
                           <tr>
                              <td style="height:40px;">&nbsp;</td>
                           </tr>
                        </table>
                     </td>
                  </tr>
                  <tr>
                     <td style="text-align:center;">
                    <ul class="footer-list-widget" style="
                           list-style: none;
                           text-decoration: none;
                           display: flex;
                           align-items: center;
                           justify-content: center;
                           ">
                           <li><a target="_blank" href="https://www.facebook.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg" 
                              style="
                              text-decoration: none;
                              color: #ffffffbf;
                              font-size: 13px;
                              padding: 0 10px;
                              font-weight: 300; "
                              >Facebook</a></li>
                           <li><a target="_blank" href="https://www.instagram.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg"
                              style="
                              text-decoration: none;
                              color: #ffffffbf;
                              font-size: 13px;
                              padding: 0 10px;
                              font-weight: 300; "
                              >Instagram</a></li>
                           <li><a target="_blank" href="https://www.reddit.com/user/Cvtrade/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button"
                              style="
                              text-decoration: none;
                              color: #ffffffbf;
                              font-size: 13px;
                              padding: 0 10px;
                              font-weight: 300; "
                              >Reddit</a></li>
                           <li><a target="_blank" href="https://youtube.com/@CVTrade?si=3bkQRCdzvvG4P5PV"
                              style="
                              text-decoration: none;
                              color: #ffffffbf;
                              font-size: 13px;
                              padding: 0 10px;
                              font-weight: 300; "
                              >Youtube</a></li>
                           <li><a target="_blank" href="https://t.me/+VD32TwJiXQMyY2E1"
                              style="
                              text-decoration: none;
                              color: #ffffffbf;
                              font-size: 13px;
                              padding: 0 10px;
                              font-weight: 300; "
                              >Telegram</a></li>
                           <li><a target="_blank" href="https://www.quora.com/profile/CV-Trade"
                              style="
                              text-decoration: none;
                              color: #ffffffbf;
                              font-size: 13px;
                              padding: 0 10px;
                              font-weight: 300; "
                              >Quora</a></li>
                           <li><a target="_blank" href="https://medium.com/@cvtradeexchange"
                              style="
                              text-decoration: none;
                              color: #ffffffbf;
                              font-size: 13px;
                              padding: 0 10px;
                              font-weight: 300; "
                              >Medium</a></li>
                        </ul>
                     </td>
                  </tr>
                  <tr>
                     <td style="height:80px;">&nbsp;</td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   </body>
</html>`,
            };
        }
        else if (type === "sellerFundTransferred") {
            const order_id = message?.order_id
            const Amount = message?.fixed_price * message?.amount
            const Currency = message?.quote_short_name
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "Order Completed - Seller Has Released the Funds",
                html: `<!doctype html>
<html lang="en-US">
   <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <title>CV Trade</title>
      <meta name="description" content="Order Completed - Seller Has Released the Funds">
      <link rel="icon" type="image/png" sizes="32x32" href="https://backend.cvtrade.io/email_banner_latest.png">
      <style type="text/css">
         a:hover {text-decoration: underline !important;}
      </style>
   </head>
  <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #00181c;" leftmargin="0">
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#00181c"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
            <td>
                <table style="background-color: #00181c; max-width:670px; margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0"
                                style="max-width:670px;background: #0c181e;border-radius: 28px;text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow: 0 0 0 1px rgb(165 231 156 / 29%);">
                            <tr>
                              <td style="text-align:center; padding: 15px;">
                                 <a href="https://cvtrade.io/" title="logo" target="_blank">
                                 <img width="670" src="https://backend.cvtrade.io/email_banner_latest.png" title="logo" alt="logo" style=" margin-bottom: -7px;">
                                 </a>
                              </td>
                           </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                        <h1 style="color:#ffffff; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                            Order Completed - Seller Has Released the Funds
                                        </h1>
                                        <p style="color:#ffffff; text-align:left; font-size:15px;line-height:24px; margin:0;">
                                            <br><br>
                                            Congratulations! The seller has successfully released the funds for your recent P2P order on our platform. Your transaction is now complete.
                                            <br><br>
                                            <strong>Order Details:</strong><br>
                                            Order ID: ${order_id}<br>
                                            <strong>Next Steps:</strong><br>
                                            1. Check Your Wallet:<br>
                                            - The ${Currency} should now be available in your wallet. Please log in to your account to verify the balance.<br><br>
                                            2. Rate the Transaction:<br>
                                            - We encourage you to rate your experience with the seller. Your feedback helps us maintain a high-quality trading environment.
                                            <br><br>
                                            If you encounter any issues or discrepancies, please reach out to our support team immediately.
                                            <br><br>
                                            Thank you for choosing our platform for your P2P transactions. We hope to serve you again in the future.
                                            <br><br>
                                            Best regards,<br>
                                            CV Trade-EXCHANGE
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">
                                   <ul class="footer-list-widget" style="
                                              list-style: none;
                                              text-decoration: none;
                                              display: flex;
                                              align-items: center;
                                              justify-content: center;
                                          ">
                                              <li><a target="_blank" href="https://www.facebook.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg" 
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Facebook</a></li>
                                              <li><a target="_blank" href="https://www.instagram.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Instagram</a></li>
                                              <li><a target="_blank" href="https://www.reddit.com/user/Cvtrade/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Reddit</a></li>
                                              <li><a target="_blank" href="https://youtube.com/@CVTrade?si=3bkQRCdzvvG4P5PV"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Youtube</a></li>
                                              <li><a target="_blank" href="https://t.me/+VD32TwJiXQMyY2E1"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Telegram</a></li>
                                              <li><a target="_blank" href="https://www.quora.com/profile/CV-Trade"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Quora</a></li>
                                              <li><a target="_blank" href="https://medium.com/@cvtradeexchange"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Medium</a></li>
                                          </ul>
                        </td>
                    </tr>
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            };
        }
        else if (type === "p2pOrderMatch") {
            const orderId = message?._id
            const amount = message?.amount
            const base_currency = message?.base_short_name
            const quote_currency = message?.quote_short_name
            const price = message?.fixed_price
            mailOptions = {
                from: "support@cvtrade.io",
                to: receiver,
                subject: "P2P Order Placed",
                html: `<!doctype html>
<html lang="en-US">
   <head>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
      <title>CV Trade</title>
      <meta name="description" content="P2P Order Placed">
      <link rel="icon" type="image/png" sizes="32x32" href="https://backend.cvtrade.io/email_banner_latest.png">
      <style type="text/css">
         a:hover {text-decoration: underline !important;}
      </style>
   </head>
   <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #00181c;" leftmargin="0">
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#00181c"
        style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
        <tr>
            <td>
                <table style="background-color: #00181c; max-width:670px;  margin:0 auto;" width="100%" border="0"
                    align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0"
                                style="max-width:670px;background: #0c181e;border-radius: 28px;text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow: 0 0 0 1px rgb(165 231 156 / 29%);">
                                 <tr>
                              <td style="text-align:center; padding: 15px;">
                                 <a href="https://cvtrade.io/" title="logo" target="_blank">
                                 <img width="670" src="https://backend.cvtrade.io/email_banner_latest.png" title="logo" alt="logo" style=" margin-bottom: -7px;">
                                 </a>
                              </td>
                           </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px;">
                                        <h1
                                            style="color:#ffffff; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                            P2P Order Placed
                                        </h1>

                                        <p
                                            style="color:#ffffff; text-align:left; font-size:15px;line-height:24px; margin:0;">
                                            <br><br>

                                            <strong>Order Details:</strong><br>
                                            <span style="color:#ffffff;">Order ID: ${orderId}</span> <br>
                                            <span style="color:#ffffff;">Amount: ${amount} ${base_currency}</span> <br>
                                            <span style="color:#ffffff;">Price: ${price} ${quote_currency} /
                                                ${base_currency}</span> <br>

                                            <strong> Steps:</strong><br>
                                            1. <strong>Contact the Counterparty:</strong><br>
                                            Please reach out to the other party using the in-platform chat feature to
                                            coordinate the transaction. Timely communication ensures a smooth and quick
                                            process.
                                            <br><br>
                                            2. <strong>Complete the Payment Process:</strong><br>
                                            - If you are the buyer, please make the payment as per the agreed terms.<br>
                                            - If you are the seller, please confirm the receipt of payment before
                                            releasing the assets.
                                            <br><br>
                                            3. <strong>Confirm Transaction Completion:</strong><br>
                                            Once the payment has been made and confirmed, ensure to mark the transaction
                                            as completed in the platform.
                                            <br><br>

                                            Please remember to follow all platform guidelines to ensure a secure and
                                            smooth transaction. If you have any questions or face any issues, do not
                                            hesitate to contact our support team.
                                            <br><br>

                                            Thank you for choosing our platform for your P2P transactions.
                                            <br><br>
                                            Best regards, <br>
                                            Cv Trade-EXCHANGE
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:40px;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">
                     <ul class="footer-list-widget" style="
                                              list-style: none;
                                              text-decoration: none;
                                              display: flex;
                                              align-items: center;
                                              justify-content: center;
                                          ">
                                              <li><a target="_blank" href="https://www.facebook.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg" 
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Facebook</a></li>
                                              <li><a target="_blank" href="https://www.instagram.com/share/DQZSU4jg68vvvAKt/?mibextid=qi2Omg"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Instagram</a></li>
                                              <li><a target="_blank" href="https://www.reddit.com/user/Cvtrade/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Reddit</a></li>
                                              <li><a target="_blank" href="https://youtube.com/@CVTrade?si=3bkQRCdzvvG4P5PV"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Youtube</a></li>
                                              <li><a target="_blank" href="https://t.me/+VD32TwJiXQMyY2E1"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Telegram</a></li>
                                              <li><a target="_blank" href="https://www.quora.com/profile/CV-Trade"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Quora</a></li>
                                              <li><a target="_blank" href="https://medium.com/@cvtradeexchange"
                                                  style="
                                                  text-decoration: none;
                                                  color: #ffffffbf;
                                                  font-size: 13px;
                                                  padding: 0 10px;
                                                  font-weight: 300; "
                                              >Medium</a></li>
                                          </ul>
                        </td>
                    </tr>
                    <tr>
                        <td style="height:80px;">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            };
        }

        const info = await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = {
    mobile_marketing,
    email_marketing,
};
