import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/signup", async (req, res) => {
    try {
      const { name, email, whatsapp } = req.body;

      // Create a test account if no real credentials are provided
      // In production, you would use real SMTP credentials
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER || "test",
          pass: process.env.SMTP_PASS || "test",
        },
      });

      // If using ethereal test account, we need to generate one if not provided
      if (!process.env.SMTP_USER) {
        const testAccount = await nodemailer.createTestAccount();
        transporter.options.auth = {
          user: testAccount.user,
          pass: testAccount.pass,
        };
      }

      const info = await transporter.sendMail({
        from: `"A D Professional Solution" <${process.env.SMTP_USER || "noreply@adprofessionals.com"}>`,
        to: "adprofessionalsolution@gmail.com",
        subject: "New Client Signup - A D Professional Solution",
        text: `A new client has signed up!\n\nName: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}`,
        html: `
          <h3>New Client Signup</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        `,
      });

      console.log("Message sent: %s", info.messageId);
      if (!process.env.SMTP_USER) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }

      res.json({ success: true, message: "Signup successful and email sent to admin." });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, error: "Failed to send email notification." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
