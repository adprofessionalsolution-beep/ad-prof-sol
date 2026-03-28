import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";

// In-memory database for clients
interface Client {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  plan: string;
  status: 'active' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

let clients: Client[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/signup", async (req, res) => {
    try {
      const { name, email, whatsapp, plan } = req.body;

      // Add to in-memory database
      const newClient: Client = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        whatsapp,
        plan: plan || 'Free Plan',
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        createdAt: new Date().toISOString()
      };
      clients.push(newClient);

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
        text: `A new client has signed up!\n\nName: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}\nPlan: ${plan || 'Free Plan'}`,
        html: `
          <h3>New Client Signup</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>WhatsApp:</strong> ${whatsapp}</p>
          <p><strong>Plan:</strong> ${plan || 'Free Plan'}</p>
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

  // Admin API routes
  app.get("/api/admin/clients", (req, res) => {
    res.json({ success: true, clients });
  });

  app.post("/api/admin/clients/:id/status", (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'cancel' or 'extend'

    const client = clients.find(c => c.id === id);
    if (!client) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    if (action === 'cancel') {
      client.status = 'cancelled';
    } else if (action === 'extend') {
      client.status = 'active';
      // Extend by 30 days
      const currentExpiry = new Date(client.expiresAt);
      client.expiresAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    res.json({ success: true, client });
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
