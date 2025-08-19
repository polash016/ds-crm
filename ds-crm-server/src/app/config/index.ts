import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  salt_rounds: process.env.SALT_ROUNDS,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    jwt_secret_expires_in: process.env.JWT_EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  courier: {
    courier_api_key: process.env.STEADFAST_API_KEY,
    courier_secret_key: process.env.STEADFAST_SECRET_KEY,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  email: process.env.EMAIL,
  email_app_pass: process.env.EMAIL_APP_PASS,
};
