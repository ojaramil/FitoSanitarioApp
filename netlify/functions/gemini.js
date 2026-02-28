const Groq = require("groq-sdk");

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'La API Key de GROQ no está configurada en Netlify.' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const action = body.action;

        // Inicializamos el cliente de Groq con la llave
        const groq = new Groq({ apiKey: apiKey });

        if (action === 'getModels') {
            // Groq no tiene un endpoint idéntico de listar modelos para publico general, mockeamos una respuesta exitosa
            return {
                statusCode: 200,
                body: JSON.stringify({
                    models: [
                        { name: "Llama 3 8B (Groq Fast)" },
                        { name: "Llama 3 70B (Groq Expert)" },
                        { name: "Mixtral 8x7B" }
                    ]
                })
            };
        }

        if (action === 'generateContent') {
            // Extraer el texto del payload que mandaba el frontend para Gemini
            // payload normal de Gemini: { contents: [{ role: "user", parts: [{ text: "el prompt" }] }] }
            const geminiContents = body.payload?.contents || [];
            let userPrompt = "Hola";

            if (geminiContents.length > 0 && geminiContents[0].parts && geminiContents[0].parts.length > 0) {
                userPrompt = geminiContents[0].parts[0].text;
            }

            // Llamar a Groq con el modelo Llama 3 70B (Súper inteligente y gratis)
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: userPrompt,
                    }
                ],
                model: "llama-3.3-70b-versatile", // Modelo actual y rápido de Groq
                temperature: 0.5,
            });

            const groqResponseText = chatCompletion.choices[0]?.message?.content || "Sin respuesta";

            // Formatear la respuesta de vuelta como si fuera Gemini para no romper tu frontend
            const fakeGeminiResponse = {
                candidates: [
                    {
                        content: {
                            parts: [{ text: groqResponseText }]
                        }
                    }
                ]
            };

            return {
                statusCode: 200,
                body: JSON.stringify(fakeGeminiResponse)
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Acción no válida.' })
        };

    } catch (error) {
        console.error("Error en la función de Netlify (Groq):", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
