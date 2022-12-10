/* eslint-disable no-undef */
const resetPasswordEmailMarkup = (token) => `
  <table border="0" cellpadding="0" cellspacing="0" style="width: 300px; height: 300px; text-align: center; margin: 50px  auto 0;">
    <tr style="height: 72px;">
      <td>
        <h2 style="font-size: 16px; line-height: 20px; font-weight: 600; color: #0F1111; margin: 0;">We got a request to reset your account password for the </h2>
        <a style="text-decoration: none; font-size: 16px; line-height: 20px; font-weight: 600; color: #4990A8; cursor: pointer;">www.znac.org.</a>
      </td>
    </tr>
    <tr style="height: 20px;">
      <td>
        <p style="font-size: 14px; line-height: 17px; font-weight: 300; color: #0F1111; margin: 30px auto;">Please click the button below to reset it:</p>
      </td>
    </tr>
    <tr style="width: 150px; height: 50px;">
      <td>
        <a style="width: 80%; background-color: #4990A8; padding: 10px 50px; margin: 0 32px; color: #fff; font-size: 14px; line-height: 17px; font-weight: 300; text-align: center; text-decoration: none; border-radius: 5px;"
        href="http://localhost:3000/reset-password/${token}">Reset</a>
      </td>
    </tr>
    <tr style="height: 51; margin: 30px auto;">
      <td>
        <p style="font-size: 12px; line-height: 15px; font-weight: 300; text-align: center; color: #0F1111; margin: 0;">If you ignore this message, your password will not be changed. If you didn't request a password reset, </p>
        <a style="text-decoration: none; font-size: 12px; line-height: 15px; font-weight: 300; color: #4990A8;"
        href='mailto:znacompany@gmail.com'>let us know.</a>
      </td>
    </tr>
  </table>
`;

const successfullPasswordUpdateEmailMarkup = `
  <table border="0" cellpadding="0" cellspacing="0" style="width: 300px; height: 300px; text-align: center; margin: 50px auto 0;">
    <tr style="height: 72px;">
      <td>
        <p style="font-size: 20px; line-height: 24px; font-weight: 600; color: #0F1111; margin: 0;">This is a confirmation that your account password on the </p>
        <a style="text-decoration: none; font-size: 20px; line-height: 24px; font-weight: 600; color: #4990A8; cursor: pointer;">www.znac.org.</a>
        <p style="font-size: 20px; line-height: 24px; font-weight: 600; color: #0F1111; margin: 0;">has been successfully changed.</p>
      </td>
    </tr>
  </table>
`;

const emailConfirmationEmailMarkup = (token) => `
  <table border="0" cellpadding="0" cellspacing="0" style="width: 300px; height: 300px; text-align: center; margin: 50px  auto 0;">
    <tr style="height: 72px;">
      <td>
        <h2 style="font-size: 16px; line-height: 20px; font-weight: 600; color: #0F1111; margin: 0;">We got a request to change your account e-mail on the </h2>
        <a style="text-decoration: none; font-size: 16px; line-height: 20px; font-weight: 600; color: #4990A8; cursor: pointer;">www.znac.org.</a>
      </td>
    </tr>
    <tr style="height: 20px;">
      <td>
        <p style="font-size: 14px; line-height: 17px; font-weight: 300; color: #0F1111; margin: 30px auto;">Please click the button below to confirm the changing of the e-mail:</p>
      </td>
    </tr>
    <tr style="width: 150px; height: 50px;">
      <td>
        <a style="width: 80%; background-color: #4990A8; padding: 10px 50px; margin: 0 32px; color: #fff; font-size: 14px; line-height: 17px; font-weight: 300; text-align: center; text-decoration: none; border-radius: 5px;"
        href="http://localhost:3000/profile/update-email/${token}">Confirm e-mail</a>
      </td>
    </tr>
    <tr style="height: 51; margin: 30px auto;">
      <td>
        <p style="font-size: 12px; line-height: 15px; font-weight: 300; text-align: center; color: #0F1111; margin: 0;">If you ignore this message, your e-mail will not be changed. If you didn't request a e-mail change, </p>
        <a style="text-decoration: none; font-size: 12px; line-height: 15px; font-weight: 300; color: #4990A8;"
        href='mailto:znacompany@gmail.com'>let us know.</a>
      </td>
    </tr>
  </table>
`;

module.exports = {
  resetPasswordEmailMarkup,
  successfullPasswordUpdateEmailMarkup,
  emailConfirmationEmailMarkup,
};
