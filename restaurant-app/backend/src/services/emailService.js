import nodemailer from 'nodemailer';

const buildTransport = async () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export const sendInvitationEmail = async ({ email, nom, role, invitationUrl }) => {
  const transporter = await buildTransport();
  const subject = 'Invitation TSARALAZA';
  const text = `Bonjour ${nom},\n\nVous avez ete invite(e) en tant que ${role} sur TSARALAZA.\nActivez votre compte ici : ${invitationUrl}\n\nCe lien est valable 7 jours.`;

  if (!transporter) {
    return {
      delivered: false,
      preview: invitationUrl,
      message: 'SMTP non configure, lien renvoye en mode preview.'
    };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'TSARALAZA <noreply@tsaralaza.mg>',
    to: email,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Bonjour ${nom},</h2>
        <p>Votre compte <strong>${role}</strong> TSARALAZA est pret.</p>
        <p><a href="${invitationUrl}">Activer mon compte</a></p>
        <p>Ce lien expire sous 7 jours.</p>
      </div>
    `
  });

  return {
    delivered: true,
    preview: null,
    message: 'Invitation envoyee.'
  };
};
