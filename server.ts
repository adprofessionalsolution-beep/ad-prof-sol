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

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: `"A D Professional Solution" <${process.env.SMTP_USER}>`,
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
        console.log("Signup email sent: %s", info.messageId);
      } else {
        console.log("Mock Signup Email (SMTP not configured):", { name, email, whatsapp, plan });
      }

      res.json({ success: true, message: "Signup successful." });
    } catch (error) {
      console.error("Error sending email:", error);
      // Return success to the frontend even if email fails, so the user isn't blocked
      res.json({ success: true, message: "Signup successful, but email notification failed." });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, mobile, description } = req.body;

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: `"A D Professional Solution" <${process.env.SMTP_USER}>`,
          to: "adprofessionalsolution@gmail.com",
          subject: "New Contact Us Inquiry - A D Professional Solution",
          text: `A new inquiry has been submitted!\n\nName: ${name}\nEmail: ${email}\nMobile: ${mobile}\nDescription: ${description}`,
          html: `
            <h3>New Contact Us Inquiry</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>Description:</strong> ${description}</p>
          `,
        });
        console.log("Contact inquiry email sent: %s", info.messageId);
      } else {
        console.log("Mock Contact Inquiry Email (SMTP not configured):", { name, email, mobile, description });
      }

      res.json({ success: true, message: "Inquiry sent successfully." });
    } catch (error) {
      console.error("Error sending email:", error);
      // Return success to the frontend even if email fails, so the user isn't blocked
      res.json({ success: true, message: "Inquiry recorded, but email notification failed." });
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
