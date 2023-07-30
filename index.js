// Importar la librería qrcode-terminal para generar códigos QR en la terminal y poder vincular a wpp web.
const qrcode = require('qrcode-terminal');

// Importar las clases Client y LocalAuth de la librería whatsapp-web.js.
const { Client, LocalAuth } = require('whatsapp-web.js');

// Importar las clases Configuration y OpenAIApi de la librería openai.
const { Configuration, OpenAIApi } = require("openai");

// Definir el nombre del modelo de lenguaje a utilizar.
const MODEL_NAME = "text-davinci-003";

// Establecer el número máximo de tokens para la generación de texto.
const MAX_TOKENS = 200;

// Establecer la clave de la API de OpenAI.
const apiKey = 'API_KEY';

// Crear una nueva configuración con la clave de la API de OpenAI.
const config = new Configuration({ apiKey });

// Crear una instancia de OpenAIApi utilizando la configuración anterior.
const openai = new OpenAIApi(config);

// Crear una nueva instancia de Client con la estrategia de autenticación LocalAuth.
const client = new Client({ authStrategy: new LocalAuth() });

// Definir una función asincrónica para enviar un mensaje de bienvenida al destinatario.
const sendWelcomeMessage = async (recipient) => {
    const message = 'Hola, soy Kai. ¡Tu asistente virtual! n\ Si queres hacerme una pregunta enviame la palabra "Quiero saber" ';
    await client.sendMessage(recipient, message);
};

// Definir una función asincrónica para manejar mensajes entrantes.
const handleIncomingMessage = async (message) => {
    // Comprobar si el mensaje es "Oye Kai".
    if (message.body === 'Oye kai') {
        // Enviar un mensaje de bienvenida al remitente.
        await sendWelcomeMessage(message.from);
    } else if (message.body === 'Quiero saber' && msgAprv) {
        // Si el mensaje es "Quiero saber" y msgAprv es verdadero (ya ha sido aprobado otro mensaje), configurar el modo de asistente virtual.
        client.sendMessage(message.from, 'Haceme la pregunta y enseguida te respondo :)')
        remitente = message.from;
        asisVirtual = true;
    } else if (asisVirtual && message.from === remitente) {
        // Si el asistente virtual está activo y el mensaje proviene del mismo remitente que activó el asistente:
        // - Establecer el mensaje como prompt para la generación de texto.
        const prompt = `${message.body}`;

        // - Generar una respuesta utilizando el modelo de lenguaje de OpenAI.
        const response = await openai.createCompletion({
            model: MODEL_NAME,
            prompt: prompt,
            max_tokens: MAX_TOKENS,
            temperature: 1,
        });
        // - Enviar la respuesta generada al remitente.
        await client.sendMessage(message.from, response.data.choices[0].text);
        // Desactivar el modo de asistente virtual.
        asisVirtual = false;
    }
};

// Variables para el control del asistente virtual.
let remitente = null;
let msgAprv = false;
let asisVirtual = false;

// Escuchar el evento 'qr' y generar un código QR para la autenticación.
client.on('qr', qr => qrcode.generate(qr, { small: true }));

// Escuchar el evento 'ready' que indica que el cliente está listo.
client.on('ready', () => {
    console.log('¡El cliente está listo!');
});

// Escuchar el evento 'message_create' para manejar mensajes entrantes.
client.on('message_create', async (message) => {
    try {
        // Si msgAprv es falso y el mensaje es "Oye kai", aprobar el mensaje y enviar un mensaje de bienvenida.
        if (!msgAprv && message.body === 'Oye kai') {
            msgAprv = true;
            await sendWelcomeMessage(message.from);
        } else {
            // De lo contrario, manejar el mensaje entrante utilizando la función handleIncomingMessage.
            await handleIncomingMessage(message);
        }
    } catch (error) {
        console.error(error);
    }
});

// Inicializar el cliente para que empiece a escuchar eventos.
client.initialize();
