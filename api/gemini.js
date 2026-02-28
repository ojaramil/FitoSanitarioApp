const Groq = require("groq-sdk");

module.exports = async (req, res) => {
    // Vercel serverless functions handle CORS and methods like this
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'La API Key de GROQ no está configurada.' });
    }

    try {
        const body = req.body;
        const action = body.action;

        // Inicializamos el cliente de Groq con la llave
        const groq = new Groq({ apiKey: apiKey });

        if (action === 'getModels') {
            // Groq no tiene un endpoint idéntico de listar modelos para publico general, mockeamos una respuesta exitosa
            return res.status(200).json({
                models: [
                    { name: "Llama 3 8B (Groq Fast)" },
                    { name: "Llama 3 70B (Groq Expert)" },
                    { name: "Mixtral 8x7B" }
                ]
            });
        }

        if (action === 'generateContent') {
            // Extraer el texto del payload que mandaba el frontend para Gemini
            const geminiContents = body.payload?.contents || [];
            let userPrompt = "Hola";

            if (geminiContents.length > 0 && geminiContents[0].parts && geminiContents[0].parts.length > 0) {
                userPrompt = geminiContents[0].parts[0].text;
            }

            // Llamar a Groq con el modelo Llama 3 70B
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: userPrompt,
                    }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
            });

            const groqResponseText = chatCompletion.choices[0]?.message?.content || "Sin respuesta";

            // Formatear la respuesta de vuelta
            const fakeGeminiResponse = {
                candidates: [
                    {
                        content: {
                            parts: [{ text: groqResponseText }]
                        }
                    }
                ]
            };

            return res.status(200).json(fakeGeminiResponse);
        }

        return res.status(400).json({ error: 'Acción no válida.' });

    } catch (error) {
        console.error("Error en la función Serverless (Groq):", error);
        return res.status(500).json({ error: error.message });
    }
};
