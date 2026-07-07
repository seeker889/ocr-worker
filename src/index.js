export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        service: "OCR Upload API",
        status: "running"
      });
    }

    // POST /upload
    if (request.method === "POST" && url.pathname === "/upload") {
      try {
        const body = await request.json();

        const {
          filename,
          storagePath,
          fileSize,
          mimeType
        } = body;

        if (!filename || !storagePath) {
          return Response.json(
            {
              error: "filename and storagePath are required"
            },
            { status: 400 }
          );
        }

        const id = crypto.randomUUID();

        // Save metadata into D1
        if (env.DB) {
          await env.DB.prepare(`
            INSERT INTO documents
            (
              id,
              filename,
              storage_path,
              mime_type,
              file_size,
              status,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
            .bind(
              id,
              filename,
              storagePath,
              mimeType || "",
              fileSize || 0,
              "uploaded",
              new Date().toISOString()
            )
            .run();
        }

        return Response.json({
          success: true,
          id,
          filename,
          storagePath,
          status: "uploaded"
        });

      } catch (err) {
        return Response.json(
          {
            error: err.message
          },
          {
            status: 500
          }
        );
      }
    }

    return new Response("Not Found", {
      status: 404
    });
  }
};