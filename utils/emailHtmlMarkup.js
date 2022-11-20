/* eslint-disable no-undef */
const resetPasswordEmailMarkup = (token) => `
<div
  style="width: 300px; height: 500px; display: flex; flex-direction: column; margin: 50px auto;"
>
  <h2
    style="width: 280px; font-size: 20px; line-height: 24px; font-weight: 600; color: #0F1111; text-align: center;"
  >
    We got a request to reset your account password on the
    <a
      style="text-decoration: none; font-size: 20px; line-height: 24px; font-weight: 600; color: #4990A8; cursor: pointer;"
    >
      www.znac.org.
    </a>
  </h2>
  <p
    style="font-size: 16px; line-height: 20px; font-weight: 300; color: #0F1111; text-align: center; margin: 30px auto;"
  >
    Please click the button below to reset it:
  </p>
  <a
    style="width: 80%; background-color: #4990A8; padding: 10px 100px; margin: 0 32px; color: #fff; font-size: 14px; line-height: 17px; font-weight: 300; text-align: center; text-decoration: none; border-radius: 5px;"
    href="http://localhost:3000/reset-password/${token}"
  >
    Reset
  </a>
  <p
    style="font-size: 14px; line-height: 17px; font-weight: 300; text-align: center; color: #0F1111; margin: 30px auto"
  >
    If you ignore this message, your password will not be changed. If you didn't request a password reset,
    <a
      style="text-decoration: none; font-size: 14px; line-height: 17px; font-weight: 300; color: #4990A8;"
      href='mailto:znacompany@gmail.com'
    >
      let us know.
    </a>
  </p>
</div>
`;

const successfullPasswordUpdateEmailMarkup = `
<div
  style="margin: 0 auto; padding: 50px 0; width: 300px; "
>
  <h2
    style="width: 280px; font-size: 20px; line-height: 24px; font-weight: 600; color: #0F1111; text-align: center;"
  >
    This is a confirmation that your account password on the
    <a
      style="text-decoration: none; font-size: 20px; line-height: 24px; font-weight: 600; color: #4990A8; cursor: pointer;"
    >
      www.znac.org
    </a>
    has been successfully changed.
  </h2>
</div>
`;

const emailConfirmationEmailMarkup = (token) => `
  <div
    style="width: 300px; height: 500px; display: flex; flex-direction: column; margin: 50px auto;"
  >
    <h2
      style="width: 280px; font-size: 20px; line-height: 24px; font-weight: 600; color: #0F1111; text-align: center;"
    >
      We got a request to change your account e-mail on the
      <a
        style="ttext-decoration: none; font-size: 20px; line-height: 24px; font-weight: 600; color: #4990A8; cursor: pointer;"
      >
        www.znac.org
      </a>
       to this one.
    </h2>
    <p
      style="font-size: 16px; line-height: 20px; font-weight: 300; color: #0F1111; text-align: center; margin: 30px auto;"
    >
      Please click the button below to confirm the changing of the e-mail:
    </p>
    <a
      style="width: 80%; background-color: #4990A8; padding: 10px 100px; margin: 0 32px; color: #fff; font-size: 14px; line-height: 17px; font-weight: 300; text-align: center; text-decoration: none; border-radius: 5px;"
      href="http://localhost:3000/profile/update-email/${token}"
    >
      Confirm e-mail
    </a>
    <p
      style="font-size: 14px; line-height: 17px; font-weight: 300; text-align: center; color: #0F1111; margin: 30px auto"
    >
      If you ignore this message, your e-mail will not be changed. If you didn't request a e-mail change,
      <a
        style="text-decoration: none; font-size: 14px; line-height: 17px; font-weight: 300; color: #4990A8;"
        href='mailto:znacompany@gmail.com'
      >
        let us know.
      </a>
    </p>
  </div>
`;

module.exports = {
  resetPasswordEmailMarkup,
  successfullPasswordUpdateEmailMarkup,
  emailConfirmationEmailMarkup,
};
