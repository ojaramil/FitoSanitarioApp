exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'La API Key no está configurada en las variables de entorno de Netlify.' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const action = body.action;

        if (action === 'getModels') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            return {
                statusCode: 200,
                body: JSON.stringify(data)
            };
        }

        if (action === 'generateContent') {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body.payload)
            });
            const data = await response.json();
            
            return {
                statusCode: response.status, // Devuelve el estado original (200, 400, etc.)
                body: JSON.stringify(data)
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Acción no válida. Se esperaba "getModels" o "generateContent".' })
        };

    } catch (error) {
        console.error("Error en la función de Netlify:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
